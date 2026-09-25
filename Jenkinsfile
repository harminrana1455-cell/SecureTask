
pipeline {
    agent any

    /*
     * SecureTask - Jenkinsfile
     * Windows Jenkins compatible
     *
     * Required Jenkins credentials:
     *   docker-hub-creds - Docker Hub username/password
     *
     * Required Jenkins configuration:
     *   SonarQube server: SonarCloud
     *   SonarQube Scanner tool: SonarScanner
     *   Docker Desktop installed and running
     */

    environment {
        APP_NAME = 'securetask'
        DOCKER_REGISTRY = 'docker.io/harmin014'
        IMAGE_BACKEND = "${DOCKER_REGISTRY}/${APP_NAME}-backend"
        IMAGE_FRONTEND = "${DOCKER_REGISTRY}/${APP_NAME}-frontend"
        NODE_ENV = 'test'
    }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // STAGE 1: BUILD

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

        // STAGE 2: TEST

        stage('Test') {
            environment {
                JWT_SECRET = 'securetask-ci-test-secret-only'
            }

            steps {
                dir('backend') {
                    bat 'npm test -- --ci --coverage --reporters=default --reporters=jest-junit'
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

        // STAGE 3: CODE QUALITY

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
                        script {
                            def scannerHome = tool 'SonarScanner'

                            withSonarQubeEnv('SonarCloud') {
                                bat """
                                    "${scannerHome}\\bin\\sonar-scanner.bat" ^
                                    -Dsonar.projectKey=harminrana1455-cell_SecureTask ^
                                    -Dsonar.sources=backend/src,frontend/src ^
                                    -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** ^
                                    -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
                                """
                            }
                        }
                    }
                }
            }
        }

        // STAGE 4: SECURITY

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

        // STAGE 5: DOCKER BUILD & PUSH

        stage('Docker Build & Push') {
            steps {
                script {
                    def tag = env.BUILD_NUMBER

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'docker-hub-creds',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_TOKEN'
                        )
                    ]) {
                        bat '''
                            @echo Logging in to Docker Hub...
                            powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:DOCKER_TOKEN | docker login -u $env:DOCKER_USER --password-stdin"
                            if errorlevel 1 exit /b 1
                        '''

                        try {
                            echo "Building backend image: ${IMAGE_BACKEND}:${tag}"

                            bat """
                                docker build ^
                                -t ${IMAGE_BACKEND}:${tag} ^
                                -t ${IMAGE_BACKEND}:latest ^
                                -f backend\\Dockerfile backend
                            """

                            echo "Building frontend image: ${IMAGE_FRONTEND}:${tag}"

                            bat """
                                docker build ^
                                -t ${IMAGE_FRONTEND}:${tag} ^
                                -t ${IMAGE_FRONTEND}:latest ^
                                -f frontend\\Dockerfile frontend
                            """

                            echo 'Pushing backend images to Docker Hub...'

                            bat """
                                docker push ${IMAGE_BACKEND}:${tag}
                                if errorlevel 1 exit /b 1

                                docker push ${IMAGE_BACKEND}:latest
                                if errorlevel 1 exit /b 1
                            """

                            echo 'Pushing frontend images to Docker Hub...'

                            bat """
                                docker push ${IMAGE_FRONTEND}:${tag}
                                if errorlevel 1 exit /b 1

                                docker push ${IMAGE_FRONTEND}:latest
                                if errorlevel 1 exit /b 1
                            """

                            echo 'Both SecureTask images were pushed successfully.'

                        } finally {
                            bat 'docker logout'
                        }
                    }
                }
            }
        }

        // STAGE 6: DEPLOY TO STAGING

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying build #${env.BUILD_NUMBER} to staging..."

                    if (env.STAGING_SERVER?.trim() &&
                        env.STAGING_APP_DIR?.trim()) {

                        echo 'Staging deployment configuration detected.'
                        echo 'Remote SSH deployment is not activated yet.'
                        echo 'Configure staging SSH credentials to enable it.'

                    } else {
                        echo 'Staging deployment is pending configuration.'
                        echo 'Set STAGING_SERVER and STAGING_APP_DIR in Jenkins.'
                    }
                }
            }
        }

        // STAGE 7: RELEASE

        stage('Release') {
            steps {
                script {
                    def releaseTag =
                        env.TAG_NAME ?: "v1.0.${env.BUILD_NUMBER}"

                    echo "Release version identified: ${releaseTag}"
                    echo 'Release stage completed.'
                }
            }
        }

        // STAGE 8: MONITORING

        stage('Monitoring') {
            steps {
                script {
                    def host = env.STAGING_HOST?.trim() ?: 'localhost'

                    echo 'Checking SecureTask health endpoint...'

                    bat """
                        @echo Checking application health endpoint...
                        curl.exe -f http://${host}:5000/api/health
                        if errorlevel 1 exit /b 1
                    """

                    echo 'Health endpoint checked.'
                    echo 'Database health endpoint: /api/health/db'
                    echo 'Metrics endpoint: /api/metrics'
                }
            }
        }
    }

    // POST-BUILD ACTIONS

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