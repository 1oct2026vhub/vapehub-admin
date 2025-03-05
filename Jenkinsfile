def branchName = env.BRANCH_NAME

pipeline {
    agent any

    tools {nodejs "NodeV22"}

    parameters {
        string(name: 'dev_server', defaultValue: '43.204.197.145', description: 'Ateam Development Server')
        string(name: 'production_server', defaultValue: '', description: 'Production Server')

    }

    stages {
        stage('SonarQube Analysis') {
           steps {
               script {
                   def scannerHome = tool 'AteamSonarTool';
                   withSonarQubeEnv() {
                       sh "${scannerHome}/bin/sonar-scanner"
                   }
               }
           }            
        }

        stage('Deploy') {
            steps {                
                script {
                      // Check the current branch name
                    def server
                    def sshCredentials

                    if (branchName == 'develop') {
                        // Use deployment parameters
                        server = params.dev_server
                        sshCredentials = 'c18d359d-10fe-41d7-a495-3b84451d1043'
                    } else if (branchName == 'main') {
                        // Use production parameters
                        echo "Branch $branchName not configured for deployment."
                        return
                        server = params.dev_server
                        sshCredentials = '17ec0c13-3df4-475f-ba8d-e852220e21aa'
                    } else {
                        // Handle other branches if needed
                        echo "Branch $branchName not configured for deployment."
                        return
                    }

                    // Use SSH credentials with sshagent
                    sshagent([sshCredentials]) {
                        // SSH into the server and run commands
                        sh "ssh ubuntu@${server} \"cd /var/www/vapehub/admin/ && git pull\""
                        // Writes lock-file to cache based on the GIT_COMMIT hash
                        writeFile file: "next-lock.cache", text: "$GIT_COMMIT"

                        cache(caches: [
                            arbitraryFileCache(
                                path: "node_modules",
                                includes: "**/*",
                                cacheValidityDecidingFile: "package-lock.json"
                            )
                        ]) {
                            sh "ssh ubuntu@${server} \"cd /var/www/vapehub/admin/ && source ~/.nvm/nvm.sh && nvm use 22.14.0 && npm install\""
                        }

                        cache(caches: [
                            arbitraryFileCache(
                                path: ".next/cache",
                                includes: "**/*",
                                cacheValidityDecidingFile: "next-lock.cache"
                            )
                        ]) {
                            // aka `next build`
                            sh "ssh ubuntu@${server} \"cd /var/www/vapehub/admin/ && source ~/.nvm/nvm.sh && nvm use 22.14.0 && npm run build\""
                        }
                        // sh "ssh ubuntu@${server} \"cd /var/www/vapehub/admin/ && source ~/.nvm/nvm.sh && npm install && npm run build\""
                        sh "ssh ubuntu@${server} \"source ~/.nvm/nvm.sh && export PM2_HOME=/etc/pm2daemon && pm2 restart 'VapeHub Admin' \"" 
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
                to: "unnikrishnan@ateamsoftsolutions.com",
                attachLog: true,
                compressLog: true,
                replyTo: 'noreply@example.com'
            )
        }        
    }

}

