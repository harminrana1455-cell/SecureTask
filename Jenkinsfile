
pipeline {
    agent any

    /*
     * ============================================================
     * SecureTask - Jenkinsfile
     * Windows Jenkins compatible
     * ============================================================
     *
     * Required Jenkins credentials:
     *   docker-hub-creds - Docker Hub username/password
     *   sonar-token      - SonarCloud/SonarQube token
     *
     * Required Jenkins plugins:
     *   - Pipeline
     *   - Docker Pipeline
     *   - SonarQube Scanner
     *   - NodeJS
     *   - JUnit
     *   - HTML Publisher
     *
     * Required Jenkins configuration:
     *   - Node.js available on PATH
     *   - SonarQube server configured as "SonarQube"
     *   - Docker Desktop installed and running
     *
     * Environment variables (optional):
     *   DOCKER_REGISTRY
     *   STAGING_SERVER
     *   STAGING_APP_DIR
     *   STAGING_HOST
     *
     * ============================================================
     */

    environment {
        APP_NAME = 'securetask'
        IMAGE_BACKEND = "${env.DOCKER_REGISTRY ?: 'registry.local'}/${APP_NAME}-backend"
        IMAGE_FRONTEND = "${env.DOCKER_REGISTRY ?: 'registry.local'}/${APP_NAME}-frontend"
        NODE_ENV = 'test'
    }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ========================================================
        // STAGE 1: BUILD
        // ========================================================

        stage('Build') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            bat 'npm ci'
                        }
                    }
                }

                stage('Frontend Install & Build') {
                    steps {
                        dir('frontend') {
                            bat 'npm ci'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        // ========================================================
        // STAGE 2: TEST
        // ========================================================

        stage('Test') {
            steps {
                dir('backend') {
                    bat 'npm test -- --ci --reporters=default --reporters=jest-junit'
                    bat 'npm run test:coverage -- --ci'
                }
            }

            post {
                always {
                    junit(
                        allowEmptyResults: true,
                        testResults: 'backend/junit.xml'
                    )

                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        // ========================================================
        // STAGE 3: CODE QUALITY
        // ========================================================

        stage('Code Quality') {
            parallel {
                stage('ESLint Backend') {
                    steps {
                        dir('backend') {
                            bat 'npm run lint'
                        }
                    }
                }

                stage('ESLint Frontend') {
                    steps {
                        dir('frontend') {
                            bat 'npm run lint'
                        }
                    }
                }

                stage('SonarQube Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            bat '''
                                sonar-scanner ^
                                  -Dsonar.projectKey=securetask ^
                                  -Dsonar.sources=backend/src,frontend/src ^
                                  -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** ^
                                  -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
                            '''
                        }
                    }
                }
            }
        }

        // ========================================================
        // STAGE 4: SECURITY
        // ========================================================

        stage('Security') {
            parallel {
                stage('npm audit backend') {
                    steps {
                        dir('backend') {
                            bat '''
                                @echo Running backend dependency audit...
                                call npm audit --audit-level=high
                                if errorlevel 1 (
                                    echo WARNING: Backend audit reported vulnerabilities.
                                    echo Review the audit output and remediate findings.
                                )
                                exit /b 0
                            '''
                        }
                    }
                }

                stage('npm audit frontend') {
                    steps {
                        dir('frontend') {
                            bat '''
                                @echo Running frontend dependency audit...
                                call npm audit --audit-level=high
                                if errorlevel 1 (
                                    echo WARNING: Frontend audit reported vulnerabilities.
                                    echo Review the audit output and remediate findings.
                                )
                                exit /b 0
                            '''
                        }
                    }
                }
            }
        }

        // ========================================================
        // STAGE 5: DOCKER BUILD & PUSH
        // ========================================================

        stage('Docker Build & Push') {
            when {
                branch 'main'
            }

            steps {
                script {
                    def tag = env.BUILD_NUMBER

                    docker.withRegistry(
                        'https://index.docker.io/v1/',
                        'docker-hub-creds'
                    ) {
                        def backendImg = docker.build(
                            "${IMAGE_BACKEND}:${tag}",
                            '-f backend/Dockerfile backend/'
                        )

                        def frontendImg = docker.build(
                            "${IMAGE_FRONTEND}:${tag}",
                            '-f frontend/Dockerfile frontend/'
                        )

                        backendImg.push()
                        backendImg.push('latest')

                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
            }
        }

        // ========================================================
        // STAGE 6: DEPLOY TO STAGING
        // ========================================================

        stage('Deploy') {
            when {
                branch 'main'
            }

            steps {
                script {
                    echo "Deploying build #${env.BUILD_NUMBER} to staging..."

                    if (env.STAGING_SERVER?.trim() &&
                        env.STAGING_APP_DIR?.trim()) {

                        echo "Staging deployment configuration detected."

                        /*
                         * Actual remote deployment requires:
                         * - SSH Agent plugin
                         * - staging-ssh-key credential
                         * - SSH client available on Jenkins PATH
                         * - Docker Compose on the staging server
                         *
                         * Configure these before activating remote SSH.
                         */

                        echo "Remote SSH deployment is not activated yet."
                        echo "Configure staging SSH credentials to enable it."

                    } else {
                        echo "Staging deployment is pending configuration."
                        echo "Set STAGING_SERVER and STAGING_APP_DIR in Jenkins."
                    }
                }
            }
        }

        // ========================================================
        // STAGE 7: RELEASE
        // ========================================================

        stage('Release') {
            when {
                allOf {
                    branch 'main'
                    tag pattern: 'v\\d+\\.\\d+\\.\\d+',
                        comparator: 'REGEXP'
                }
            }

            steps {
                script {
                    def releaseTag =
                        env.TAG_NAME ?: "v1.0.${env.BUILD_NUMBER}"

                    echo "Releasing version ${releaseTag}"

                    /*
                     * Docker release tagging and pushing can be
                     * enabled after registry configuration.
                     */

                    echo "Release version identified: ${releaseTag}"
                }
            }
        }

        // ========================================================
        // STAGE 8: MONITORING
        // ========================================================

        stage('Monitoring') {
            when {
                branch 'main'
            }

            steps {
                script {
                    def host = env.STAGING_HOST?.trim() ?: 'localhost'

                    echo "Checking SecureTask health endpoints..."

                    bat """
                        @echo Checking application health endpoint...
                        curl.exe -f http://${host}:5000/api/health
                    """

                    echo "Health endpoint checked."
                    echo "Database health endpoint: /api/health/db"
                    echo "Metrics endpoint: /api/metrics"
                }
            }
        }
    }

    // ============================================================
    // POST-BUILD ACTIONS
    // ============================================================

    post {
        always {
            deleteDir()
        }

        success {
            echo "Pipeline succeeded for build #${env.BUILD_NUMBER}"
        }

        failure {
            echo "Pipeline FAILED for build #${env.BUILD_NUMBER} - review logs above"
        }
    }
}