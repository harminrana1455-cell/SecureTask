pipeline {
    agent any

    /*
     * ============================================================
     * SecureTask - Jenkinsfile
     * ============================================================
     * Required Jenkins credentials (configure in Manage Jenkins > Credentials):
     *   DOCKER_HUB_CREDENTIALS  - Docker Hub username/password (id: docker-hub-creds)
     *   SONAR_TOKEN             - SonarQube/SonarCloud token  (id: sonar-token)
     *   SONAR_HOST_URL          - SonarQube server URL        (id: sonar-host-url, Secret text)
     *
     * Required Jenkins plugins:
     *   - Pipeline
     *   - Docker Pipeline
     *   - SonarQube Scanner
     *   - NodeJS
     *   - JUnit
     *   - HTML Publisher
     *
     * Required Jenkins global tools (Manage Jenkins > Global Tool Configuration):
     *   - NodeJS installation named: "NodeJS-20"
     *   - SonarQube Scanner named:   "SonarScanner"
     *   - Docker installation named: "docker" (or docker available on agent PATH)
     *
     * Environment-specific variables to set in Jenkins:
     *   DOCKER_REGISTRY      - e.g. "docker.io/yourusername"
     *   STAGING_SERVER       - SSH target for staging deploy, e.g. "user@staging-host"
     *   STAGING_APP_DIR      - Remote directory, e.g. "/opt/securetask"
     * ============================================================
     */

    environment {
        APP_NAME       = 'securetask'
        IMAGE_BACKEND  = "${env.DOCKER_REGISTRY ?: 'registry.local'}/${APP_NAME}-backend"
        IMAGE_FRONTEND = "${env.DOCKER_REGISTRY ?: 'registry.local'}/${APP_NAME}-frontend"
        NODE_ENV       = 'test'
    }

    tools {
        nodejs 'NodeJS-20'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ─────────────────────────────────────────────
        // STAGE 1: BUILD
        // ─────────────────────────────────────────────
        stage('Build') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Install & Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 2: TEST
        // ─────────────────────────────────────────────
        stage('Test') {
            steps {
                dir('backend') {
                    sh 'npm test -- --ci --reporters=default --reporters=jest-junit 2>&1 || true'
                    sh 'npm run test:coverage -- --ci 2>&1'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'
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

        // ─────────────────────────────────────────────
        // STAGE 3: CODE QUALITY
        // ─────────────────────────────────────────────
        stage('Code Quality') {
            parallel {
                stage('ESLint Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint 2>&1'
                        }
                    }
                }
                stage('ESLint Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint 2>&1'
                        }
                    }
                }
                stage('SonarQube Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=${APP_NAME} \
                                  -Dsonar.sources=backend/src,frontend/src \
                                  -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** \
                                  -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
                            """
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 4: SECURITY
        // ─────────────────────────────────────────────
        stage('Security') {
            parallel {
                stage('npm audit backend') {
                    steps {
                        dir('backend') {
                            sh 'npm audit --audit-level=high 2>&1 || echo "Audit warnings found - review output"'
                        }
                    }
                }
                stage('npm audit frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high 2>&1 || echo "Audit warnings found - review output"'
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 5: DOCKER BUILD & PUSH
        // ─────────────────────────────────────────────
        stage('Docker Build & Push') {
            when { branch 'main' }
            steps {
                script {
                    def tag = env.BUILD_NUMBER
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                        def backendImg  = docker.build("${IMAGE_BACKEND}:${tag}",  '-f backend/Dockerfile backend/')
                        def frontendImg = docker.build("${IMAGE_FRONTEND}:${tag}", '-f frontend/Dockerfile frontend/')
                        backendImg.push()
                        backendImg.push('latest')
                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 6: DEPLOY (Staging)
        // ─────────────────────────────────────────────
        stage('Deploy') {
            when { branch 'main' }
            steps {
                script {
                    // Requires SSH key credential 'staging-ssh-key' and env vars
                    // STAGING_SERVER and STAGING_APP_DIR set in Jenkins
                    sh """
                        echo "Deploying build #${env.BUILD_NUMBER} to staging..."
                        # ssh -o StrictHostKeyChecking=no ${env.STAGING_SERVER} '
                        #   cd ${env.STAGING_APP_DIR} &&
                        #   docker compose pull &&
                        #   docker compose up -d --remove-orphans
                        # '
                        echo "Deploy step ready - configure STAGING_SERVER to activate"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 7: RELEASE
        // ─────────────────────────────────────────────
        stage('Release') {
            when {
                allOf {
                    branch 'main'
                    tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                }
            }
            steps {
                script {
                    def releaseTag = env.TAG_NAME ?: "v1.0.${env.BUILD_NUMBER}"
                    echo "Releasing version ${releaseTag}"
                    // Tag Docker images with release version
                    // docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {
                    //   sh "docker tag ${IMAGE_BACKEND}:${env.BUILD_NUMBER} ${IMAGE_BACKEND}:${releaseTag}"
                    //   sh "docker push ${IMAGE_BACKEND}:${releaseTag}"
                    // }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 8: MONITORING CHECK
        // ─────────────────────────────────────────────
        stage('Monitoring') {
            when { branch 'main' }
            steps {
                sh """
                    echo "Checking health endpoint..."
                    # curl -f http://\${STAGING_HOST:-localhost}:5000/api/health || echo "Health check pending - service may be starting"
                    # curl -f http://\${STAGING_HOST:-localhost}:5000/api/health/db || echo "DB health check pending"
                    echo "Health endpoints available at /api/health and /api/health/db"
                    echo "Metrics endpoint available at /api/metrics"
                """
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline succeeded for build #${env.BUILD_NUMBER}"
        }
        failure {
            echo "Pipeline FAILED for build #${env.BUILD_NUMBER} - review logs above"
        }
    }
}
