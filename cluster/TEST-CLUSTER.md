# Testing cluster

Here are instructions how to test different setups inside the cluster

## Network tests

You can find lots of examples to try from here also:
[https://github.com/ahmetb/kubernetes-network-policy-recipes](Kubernetes network-policy recipes)

### Allow incoming traffic to certain Pods

Set namespace first:

```sh
NS="team1"
```

#### Create and expose Pod that serves HTTP content on port 80

```sh
kubectl --context $CONTEXT --namespace $NS run test-web --image=nginx --labels=test=web --port 80

kubectl --context $CONTEXT --namespace $NS expose deployment/test-web --type=LoadBalancer
```

#### Validate that the communication is not allowed by default

```sh
kubectl --context $CONTEXT --namespace $NS run test-$RANDOM --rm -i -t --image=alpine -- sh
```

Run `wget -qO- --timeout=2 http://test-web`

#### Create Network policy to allow incoming HTTP traffic to the Pod

```sh
kubectl --context $CONTEXT --namespace $NS apply -f - <<EOF
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: web-allow-incoming
spec:
  podSelector:
    matchLabels:
      test: web
  ingress:
  - from: []
    ports:
    - port: 80
EOF
```

#### Create Network policy to allow outgoing HTTP traffic to the Pod

```sh
kubectl --context $CONTEXT --namespace $NS apply -f - <<EOF
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-outgoing-to-web-pod
spec:
  podSelector: {}
  egress:
  - to:
    - podSelector:
        matchLabels:
          test: web
    ports:
      - port: 80
EOF
```

#### Validate that the communication works now inside the network

```sh
kubectl --context $CONTEXT --namespace $NS run test-$RANDOM --rm -i -t --image=alpine -- sh
```

Run `wget -qO- --timeout=2 http://test-web`

#### Validate that the communication works now outside the network

```sh
curl http://$(kubectl --context $CONTEXT --namespace $NS get svc test-web -o jsonpath="{.status.loadBalancer.ingress[0].*}")
```

#### cleanup

```sh
kubectl --context $CONTEXT --namespace $NS delete networkpolicy web-allow-incoming
kubectl --context $CONTEXT --namespace $NS delete networkpolicy allow-outgoing-to-web-pod
kubectl --context $CONTEXT --namespace $NS delete deployments test-web
kubectl --context $CONTEXT --namespace $NS delete svc test-web
```

### Allow traffic between two namespaces

Set namespaces first:

```sh
NS1="team1"
NS2="team2"
```

#### Create and expose Pods that serves HTTP content on port 80

```sh
kubectl --context $CONTEXT --namespace $NS1 run test-web --image=nginx --labels=test=web --port 80 --expose
kubectl --context $CONTEXT --namespace $NS1 run test-web2 --image=nginx --labels=test=web2 --port 80 --expose
```

#### Validate that the communication is not allowed by default

```sh
kubectl --context $CONTEXT --namespace $NS2 run test-$RANDOM --rm -i -t --image=alpine -- sh
```

Run `wget -qO- --timeout=2 http://test-web.team1.svc.cluster.local`

#### Create Network policy to allow incoming HTTP traffic to the Pod

```sh
kubectl --context $CONTEXT --namespace $NS1 apply -f - <<EOF
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: web-allow-incoming
spec:
  podSelector:
    matchLabels:
      test: web
  ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: $NS2
    ports:
    - port: 80
EOF
```

#### Create Network policy to allow outgoing HTTP traffic to the Pod

```sh
kubectl --context $CONTEXT --namespace $NS2 apply -f - <<EOF
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-outgoing-to-ns1
spec:
  podSelector: {}
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: $NS1
    ports:
      - port: 80
EOF
```

#### Validate that the communication works now form the NS2 to test-web in NS1

```sh
kubectl --context $CONTEXT --namespace $NS2 run test-$RANDOM --rm -i -t --image=alpine -- sh
```

Run `wget -qO- --timeout=2 http://test-web.team1.svc.cluster.local`

#### Validate that the communication does not work form the NS2 to test-web2 in NS1

```sh
kubectl --context $CONTEXT --namespace $NS2 run test-$RANDOM --rm -i -t --image=alpine -- sh
```

Run `wget -qO- --timeout=2 http://test-web2.team1.svc.cluster.local`

#### cleanup

```sh
kubectl --context $CONTEXT --namespace $NS1 delete networkpolicy web-allow-incoming
kubectl --context $CONTEXT --namespace $NS2 delete networkpolicy allow-outgoing-to-ns1
kubectl --context $CONTEXT --namespace $NS1 delete deployments test-web
kubectl --context $CONTEXT --namespace $NS1 delete svc test-web
kubectl --context $CONTEXT --namespace $NS1 delete deployments test-web2
kubectl --context $CONTEXT --namespace $NS1 delete svc test-web2
```
