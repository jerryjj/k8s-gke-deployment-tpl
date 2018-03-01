# Project secrets

## Initial Setup

Make sure you are in the same directory as this SETUP-file.

### Create Key Ring and Crypto Keys

```sh
keys=( "team1" "team2" )
```

```sh
for ring in "${RINGS[@]}"; do
  gcloud kms keyrings create $ring \
  --project $PROJECT_ID \
  --location global
done
```

```sh
for ring in "${RINGS[@]}"; do
  for key in "${keys[@]}"; do
    gcloud kms keys create $key \
    --project $PROJECT_ID \
    --location global \
    --keyring $ring \
    --purpose encryption
  done
done
```

### Create Bucket for encrypted secrets

```sh
for key in "${keys[@]}"; do
  gsutil mb -p $PROJECT_ID -c regional -l europe-west1 gs://$PROJECT_ID-$key-secrets
done
```

## Permission management

### Listing KeyRings current permissions

```sh
RING="RING_NAME_HERE"
gcloud kms keyrings get-iam-policy $RING \
--project $PROJECT_ID \
--location global
```

### Listing CryptoKeys current permissions

```sh
RING="RING_NAME_HERE"
KEY="KEY_NAME_HERE"
gcloud kms keys get-iam-policy $KEY \
--project $PROJECT_ID \
--location global \
--keyring $RING
```

### Add account as KeyRing Admin

Allows anyone with the permission to create KeyRings and create, modify, disable, and destroy CryptoKeys

```sh
USER_EMAIL="USER_EMAIL_HERE"
RING="RING_NAME_HERE"
gcloud kms keyrings add-iam-policy-binding $RING \
--project $PROJECT_ID \
--location global \
--member user:$USER_EMAIL \
--role roles/cloudkms.admin
```

### Add account as KeyRing user (encrypt and decrypt)

Allows anyone with the permission to encrypt and decrypt items with the keys in the KeyRing

```sh
USER_EMAIL="USER_EMAIL_HERE"
RING="RING_NAME_HERE"
gcloud kms keyrings add-iam-policy-binding $RING \
--project $PROJECT_ID \
--location global \
--member user:$USER_EMAIL \
--role roles/cloudkms.cryptoKeyEncrypterDecrypter
```

Other roles:

* roles/cloudkms.cryptoKeyEncrypter -- Allow only encrypting
* roles/cloudkms.cryptoKeyDecrypter -- Allow only decrypting

### Add account as CryptoKey user

Allows anyone with the permission to encrypt and decrypt items with this key in the KeyRing

```sh
USER_EMAIL="USER_EMAIL_HERE"
RING="RING_NAME_HERE"
KEY="KEY_NAME_HERE"
gcloud kms keys add-iam-policy-binding $KEY \
--project $PROJECT_ID \
--location global \
--keyring $RING \
--member user:$USER_EMAIL \
--role roles/cloudkms.cryptoKeyEncrypterDecrypter
```

### Always give the user permissions to the correct bucket also

```sh
ROLE=objectViewer # objectViewer: For users who can only decrypt
ROLE=objectCreator # For users who can encrypt
ROLE=objectAdmin # For users who are KeyRing admins

USER_EMAIL="USER_EMAIL_HERE"
KEY="KEY_NAME_HERE"
gsutil iam ch user:$USER_EMAIL:$ROLE gs://$PROJECT_ID-$KEY-secrets
````
