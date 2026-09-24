def branchName = env.BRANCH_NAME

pipeline {
    agent any

    stages {
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'VapehubSonarTool'
                    withSonarQubeEnv('VapehubSonar') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (branchName != 'staging-v2') {
                        echo "Branch ${branchName} not configured for deployment."
                        return
                    }
                    sshagent(['vapehub-localhost-ssh']) {
                        sh "ssh -o StrictHostKeyChecking=no ubuntu@localhost \"cd /var/www/vapehub/admin/ && git pull\""
                        sh "ssh -o StrictHostKeyChecking=no ubuntu@localhost \"cd /var/www/vapehub/admin/ && npm install\""
                        sh "ssh -o StrictHostKeyChecking=no ubuntu@localhost \"cd /var/www/vapehub/admin/ && export NODE_OPTIONS=--max-old-space-size=4096 && npm run build\""
                        sh "ssh -o StrictHostKeyChecking=no ubuntu@localhost \"pm2 restart 'Admin'\""
                    }
                }
            }
        }
    }

    post {
        always {
            emailext (
                subject: "Jenkins Build ${currentBuild.result}",
                body: """<p>The Jenkins build for ${env.JOB_NAME} has finished.</p>
                        <p>Build result: ${currentBuild.result}</p>""",
                to: "mahesh@ateamsoftsolutions.com, geethu.e@ateamsoftsolutions.com",
                attachLog: true, compressLog: true, replyTo: 'noreply@example.com'
            )
        }
    }
}