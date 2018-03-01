# Kubernetes Schema handling

## installing the tooling

```sh
cd tooling && yarn install && cd ..
```

## To generate K8s Secrets

You can use the tooling to generate K8s Secret schemas from your local copy of the secrets.
This requires that you have had the credentials to first fetch the secrets locally.

ie. If you would like to generate secrets for Team2 SQL connection, you would run the following commands:

```sh
NAMESPACE=team2
source ../secrets/contents/$NAMESPACE/$ENV/sql.env

node tooling/create-secrets.js $NAMESPACE $ENV ./$NAMESPACE/mappings/payments.secrets.json \
./$NAMESPACE/schemas/secrets
```

After this you can use the generated schema to install them to the K8s cluster if you have the proper RBAC role
assigned to you:

```sh
kubectl --context $CONTEXT --namespace $NAMESPACE apply \
-f ./$NAMESPACE/schemas/secrets/$ENV.$NAMESPACE.sql.secrets.yml
```

## To generate K8s schemas from templates

There is example template inside the mappings directory, which shows how to generate ready K8s schemas from templated schema.
To generate the ready schema from the template, run the following command:

```sh
NAMESPACE=team1

node tooling/create-schema.js $NAMESPACE $ENV ./$NAMESPACE/mappings/api.deployment.yml \
./$NAMESPACE/schemas VERSION=latest
```
