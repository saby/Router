@Library('pipeline') _

def version = '24.6200'

if (prepare_run(version)) {
    node (get_label()) {
        checkout_pipeline("rc-${version}")
        run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
        run_branch.execute('router', version)
    }
}