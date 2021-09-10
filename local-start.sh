#!/bin/bash

set -e
set -u

usage () {
cat << EOF
This scripts helps to build and run locally dashboard backend
with frontend included against remote Che Cluster.

Prerequisite for usage is having a kubernetes cluster in KUBECONFIG
and have access to Che namespace (use $CHE_NAMESPACE env var to configure it).

Arguments:
  -f|--force-build : by default packages are compiled only when they were not previously.
                      This option should be used if compiled files must be overridden with fresher version.
Env vars:
  KUBECONFIG    : Kubeconfig file location. Default: "$HOME/.kube/config"
  CHE_NAMESPACE : kubernetes namespace where Che Cluster should be looked into. Default: "eclipse-che"
Examples:
$0
$0 --force-build
EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      '-f'|'--force-build') FORCE_BUILD="true"; shift 0;;
      '--help') usage; exit 0;;
      *) echo "[ERROR] Unknown parameter is used: $1."; usage; exit 1;;
    esac
    shift 1
  done
}

SCRIPT_DIR=$(dirname $(readlink -f "$0"))

FORCE_BUILD="false"
# Init Che Namespace with the default value if it's not set
CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"

# guide backend to use the current cluster from kubeconfig
export LOCAL_RUN="true"
export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
DASHBOARD_FRONTEND=${SCRIPT_DIR}/packages/dashboard-frontend
DASHBOARD_BACKEND=${SCRIPT_DIR}/packages/dashboard-backend

parse_args "$@"

if [ "$FORCE_BUILD" == "true" ] || \
    [ ! -d $DASHBOARD_FRONTEND/lib ] || [ -z "$(ls -A $DASHBOARD_FRONTEND/lib)" ]; then
  echo "[INFO] Compiling frontend"
  yarn --cwd $DASHBOARD_FRONTEND build:dev
fi

if [ "$FORCE_BUILD" == "true" ] || \
    [ ! -d $DASHBOARD_BACKEND/lib ] || [ -z "$(ls -A $DASHBOARD_BACKEND/lib)" ]; then
  echo "[INFO] Compiling backend"
  yarn --cwd $DASHBOARD_BACKEND build:dev
fi

export CHE_HOST=http://localhost:8080
CHE_URL=$(oc get checluster -n $CHE_NAMESPACE eclipse-che -o=json | jq -r '.status.cheURL')

# we use relative to the static server path which is starting with '../../' to serv the dashboard-frontend
# build output directory. In the case of docker build dashboard-frontend output directory will be copied
# into the './public' directory (default value for static server)
PUBLIC_FOLDER=../../../../$DASHBOARD_FRONTEND/lib

yarn --cwd $DASHBOARD_BACKEND start:debug \
  --publicFolder $PUBLIC_FOLDER \
  --cheApiUpstream $CHE_URL