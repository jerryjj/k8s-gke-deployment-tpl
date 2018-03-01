# Example Deployment

## Build & Deploy the containers of the API and Payments services

```sh
git clone https://github.com/jerryjj/k8s-demo-team1-api team1/src

cd team1/src && ./cloud-build.sh $ENV latest

git clone https://github.com/jerryjj/k8s-demo-team2-payments team2/src

cd team2/src && ./cloud-build.sh $ENV latest
```

## Generate deployment schemas

```sh
node tooling/create-schema.js team1 $ENV ./team1/mappings/api.deployment.yml \
./team1/schemas VERSION=latest

node tooling/create-schema.js team2 $ENV ./team2/mappings/payments.deployment.yml \
./team2/schemas VERSION=latest
```

## Deploying

### Deploying Team1 resources

```sh
kubectl --context=$CONTEXT --namespace team1 apply -f team1/schemas/api.deployment.yml
kubectl --context=$CONTEXT --namespace team1 apply -f team1/schemas/api.service.yml
kubectl --context=$CONTEXT --namespace team1 apply -f team1/schemas/api.policies.yml
```

### Deploying Team2 resources

```sh
kubectl --context=$CONTEXT --namespace team2 apply -f team2/schemas/payments.deployment.yml
kubectl --context=$CONTEXT --namespace team2 apply -f team2/schemas/payments.service.yml
kubectl --context=$CONTEXT --namespace team2 apply -f team2/schemas/payments.policies.yml
```

## Testing

### First get the Public IP address of the WEB API

```sh
API_IP=$(kubectl --context=$CONTEXT --namespace team1 get svc api -o jsonpath="{.status.loadBalancer.ingress[0].*}")
```

### Then you can send requests to it

```sh
curl http://$API_IP/payments/status
```

You should receive following response:

```json
{"status":"ok","message":"200 OK"}
```

## Cleanup

```sh
kubectl --context=$CONTEXT --namespace team1 delete deployment api
kubectl --context=$CONTEXT --namespace team1 delete svc api
kubectl --context=$CONTEXT --namespace team1 delete -f team1/schemas/api.policies.yml

kubectl --context=$CONTEXT --namespace team2 delete deployment payments
kubectl --context=$CONTEXT --namespace team2 delete svc payments
kubectl --context=$CONTEXT --namespace team2 delete -f team2/schemas/payments.policies.yml
```
