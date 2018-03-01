# Configuring access

## First define the user you want to give access to

```sh
EMAIL="USER_EMAIL_HERE"
```

## Give user cluster viewer IAM role

```sh
gcloud projects add-iam-policy-binding $PROJECT_ID \
--project=$PROJECT_ID \
--member user:$EMAIL \
--role projects/$PROJECT_ID/roles/KubeCreds
```

## Give user the correct role-assigment to a namespace

```sh
ROLE="ROLE_NAME_HERE" # see schemas/rbac-roles.yml; if the role isn't ClusterRole, remember to switch it from roleRef also
NAMESPACE="NAMESPACE_NAME_HERE" # see schemas/$ENV.namespaces.yml
NAME=$(echo "${EMAIL%@*}")

kubectl --context $CONTEXT apply -f - <<EOF
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: $NAME-$ROLE
  namespace: $NAMESPACE
subjects:
- kind: User
  name: $EMAIL
roleRef:
  kind: ClusterRole
  name: $ROLE
  apiGroup: rbac.authorization.k8s.io
EOF
```

## Check that the role works

```sh
# check wether the user can update deployments (role: deployment-manager)
kubectl --context=$CONTEXT auth can-i update deployments --namespace $NAMESPACE --as $EMAIL

# check wether the user can create networkpolicies (role: netpolicy-manager)
kubectl --context=$CONTEXT auth can-i create networkpolicy --namespace $NAMESPACE --as $EMAIL
```

**Once the role has been given, that user needs to download the cluster credentials before running any `kubectl` -commands:**

You can send that user the output of this command:

```sh
echo "gcloud container clusters get-credentials $CLUSTER_NAME --project $PROJECT_ID --zone $CLUSTER_ZONE"
```
