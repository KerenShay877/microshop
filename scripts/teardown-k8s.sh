#!/bin/bash
set -euo pipefail

NAMESPACE="microshop"

echo "=== Tearing down microshop from Kubernetes ==="

# Delete namespace (deletes all resources in it)
if kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
  echo ">>> Deleting namespace $NAMESPACE..."
  kubectl delete ns "$NAMESPACE" --timeout=120s
  echo "Namespace deleted."
else
  echo "Namespace $NAMESPACE not found, skipping."
fi

# Clean up PVCs that may persist outside namespace
echo ">>> Cleaning up any remaining PVCs..."
kubectl delete pvc -l app=postgres --all-namespaces 2>/dev/null || true
kubectl delete pvc -l app=rabbitmq --all-namespaces 2>/dev/null || true

echo ""
echo "=== Teardown Complete ==="
echo "To stop minikube: minikube stop"
echo "To delete minikube: minikube delete"
