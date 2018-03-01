# Setting up the project

## Initial Setup

Make sure you are in the same directory as this SETUP-file.

### Create project

```sh
gcloud projects create $PROJECT_ID \
--organization=$ORGANIZATION_ID
```

### Enable Billing

```sh
gcloud beta billing projects link $PROJECT_ID \
--billing-account $BILLING_ID
```

### Enable APIs

#### Compute Engine

```sh
gcloud services enable compute.googleapis.com \
--project=$PROJECT_ID
```

#### Kubernetes Engine

```sh
gcloud services enable container.googleapis.com \
--project=$PROJECT_ID
```

#### Container registry

```sh
gcloud services enable containerregistry.googleapis.com \
--project=$PROJECT_ID
```

#### Container Cloud Builder

```sh
gcloud services enable cloudbuild.googleapis.com \
--project=$PROJECT_ID
```

#### KMS

```sh
gcloud services enable cloudkms.googleapis.com \
--project=$PROJECT_ID
```

### IAM Policy

#### Get current IAM policy

```sh
gcloud projects get-iam-policy $PROJECT_ID > $PROJECT_ID.iam.policy.yml
```

#### Add Audit Config

```sh
cat <<EOF >> $PROJECT_ID.iam.policy.yml
auditConfigs:
- auditLogConfigs:
  - logType: DATA_WRITE
  - logType: DATA_READ
  service: storage.googleapis.com
- auditLogConfigs:
  - logType: DATA_WRITE
  - logType: DATA_READ
  service: cloudkms.googleapis.com
EOF
```

#### Update Project IAM Policy

```sh
gcloud projects set-iam-policy $PROJECT_ID $PROJECT_ID.iam.policy.yml
```

### KMS Setup

See `../secrets/SETUP.md`

### Service Accounts

Here is an example how to create a Cloud SQL service account for Team2
that would be used from Cloud SQL Container Proxy

```sh
NS=team2
KEY_NAME="cloud-sql-user"
gcloud iam service-accounts create $KEY_NAME \
--project=$PROJECT_ID \
--display-name $KEY_NAME

gcloud projects add-iam-policy-binding $PROJECT_ID \
--project=$PROJECT_ID \
--member serviceAccount:$KEY_NAME@$PROJECT_ID.iam.gserviceaccount.com \
--role roles/cloudsql.client

gcloud iam service-accounts keys create \
--project=$PROJECT_ID \
--key-file-type json \
--iam-account $KEY_NAME@$PROJECT_ID.iam.gserviceaccount.com \
../secrets/contents/$NS/$ENV/$KEY_NAME.json
```

### Cluster Setup

See `../cluster/SETUP.md`

### Push all secrets to cloud

See `../secrets/README.md`
