# Project Secrets

All secrets in this project are stored as encrypted files to Google Cloud Storage.
The Encryption is done with Keys managed by Google Cloud KMS.

Make sure you are running these commands in the `secrets` -folder and have set the required environment
variables.

**!IMPORTANT!**

You should never push your secrets as plain text or the generated Kubernetes schemas to your Version Control.
You may push them once crypted if you really want, but there really isn't a need for that usually.

## How to fetch secrets

If you have permissions, you may fetch the decrypted secrets from GCS with following command:

```sh
tooling/fetch.sh [owner] [environment]
```

ie. If you are working with Team2 and have access to the secrets on development environment,
you can run the following command to fetch them locally:

```sh
tooling/fetch.sh team2 dev
```

After you have ran the command, you will find all secrets for Qviks Development environment in folder
`contents/team2/dev/`.

## Updating secrets

If you have the proper permissions, you may update the secrets, by first fetching them and then pushing the changes
with following command:

```sh
tooling/push.sh [owner] [environment]
```

ie. If you are working with Team2 and have access to the secrets on development environment,
you can run the following command to update them from the `contents/team2/dev` -folder:

```sh
tooling/push.sh team2 dev
```
