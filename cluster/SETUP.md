# Setting up Kubernetes Engine

Make sure you are in the same directory as this SETUP-file.

## Create and Configure network

Network name | Subnetwork name  | Range        | Gateway  | Secondary Ranges
-------------|------------------|--------------|----------|----------------------------------------
demo-network | private-eu-west1 | 10.5.0.0/22  | 10.5.0.1 |
demo-network | cluster-eu-west1 | 10.56.0.0/14 | 10.8.0.0 | pods=10.0.0.0/14 , services=10.4.4.0/22

```sh
gcloud compute networks create demo-network \
--project=$PROJECT_ID \
--subnet-mode=custom

gcloud compute networks subnets create private-eu-west1 \
--project=$PROJECT_ID \
--network=demo-network --region=europe-west1 --range=10.5.0.0/22

gcloud compute networks subnets create cluster-eu-west1 \
--project=$PROJECT_ID \
--network=demo-network --region=europe-west1 \
--range=10.4.0.0/22 \
--secondary-range pods=10.0.0.0/14 \
--secondary-range services=10.4.4.0/22 \
--enable-private-ip-google-access
```

## Configure Firewall rules

```sh
gcloud compute firewall-rules create demo-private-allow-internal \
--project=$PROJECT_ID \
--network demo-network \
--allow tcp,udp,icmp --source-ranges 10.5.0.0/22
```

## Create Kubernetes Engine Cluster

### Create cluster and default pool

```sh
gcloud container clusters create $CLUSTER_NAME \
--project $PROJECT_ID \
--zone $CLUSTER_ZONE \
--machine-type $CLUSTER_MACHINE_TYPE \
--num-nodes "3" \
--scopes storage-ro,logging-write,monitoring,service-control,service-management,trace \
--network "demo-network" \
--enable-cloud-logging --enable-cloud-monitoring \
--enable-network-policy \
--enable-autoupgrade --maintenance-window "04:00" \
--enable-ip-alias --subnetwork "cluster-eu-west1" \
--cluster-secondary-range-name "pods" --services-secondary-range-name "services" \
--labels env=$ENV \
--tags=$CLUSTER_NAME,$ENV-$CLUSTER_NAME
```

### Create any additional pools

ie. Create a Higher memory pool

```sh
gcloud container node-pools create high-mem-pool \
--project $PROJECT_ID \
--cluster $CLUSTER_NAME \
--zone $CLUSTER_ZONE \
--machine-type n1-standard-4 \
--image-type "COS" \
--disk-size "100" \
--num-nodes "3" \
--enable-autoupgrade \
--labels env=$ENV \
--tags=$CLUSTER_NAME,$ENV-$CLUSTER_NAME
```

### Get cluster credentials

```sh
gcloud container clusters get-credentials $CLUSTER_NAME \
--project $PROJECT_ID \
--zone $CLUSTER_ZONE
```

### Create Custom Role for Kubernetes Credential fetching

```sh
gcloud iam roles create KubeCreds \
--title "Kubernetes Credentials" \
--description "Allows fetching Cluster credentials" \
--permissions container.clusters.get,container.clusters.getCredentials \
--stage beta \
--project=$PROJECT_ID
```

### Set Cluster CONTEXT for rest of the setup

```sh
export CONTEXT=`kubectl config view | awk '{print $2}' | grep $CLUSTER_NAME | tail -n 1`
```

### Add yourself as ClusterAdmin

```sh
ACCOUNT=$(gcloud info --format='value(config.account)')
kubectl --context $CONTEXT create clusterrolebinding creator-cluster-admin-binding \
--clusterrole=cluster-admin --user=$ACCOUNT
```

### Create common RBAC roles

```sh
kubectl --context $CONTEXT apply -f schemas/rbac-roles.yml
```

### Create namespaces

```sh
kubectl --context $CONTEXT apply -f schemas/namespaces.yml
```

### Disable networking from all namespaces by default

```sh
NAMESPACES=($(awk -F ": " '$1 ~ /name$/ {print $2}' schemas/namespaces.yml | awk '!a[$0]++' | tr '\n' ' '))
for ns in "${NAMESPACES[@]}"; do
  kubectl --context $CONTEXT --namespace $ns apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF
done
```

### Allow DNS inside cluster

```sh
kubectl --context $CONTEXT label namespace kube-system name=kube-system

for ns in "${NAMESPACES[@]}"; do
  kubectl --context $CONTEXT --namespace $ns apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-access
spec:
  podSelector:
    matchLabels: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
EOF
done
```

## Configuring access

See `ACCESS-CONFIG.md` for details

## Testing cluster

See `TEST-CLUSTER.md` for details
