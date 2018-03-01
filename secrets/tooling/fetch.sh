#! /bin/bash

KEY=$1
RING=$2
CWD=`pwd`
TMP="$CWD/tmp"
CONTENTS_DIR="$CWD/contents"

C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
NC='\033[0;0m'

printUsage() {
  echo "Required environment variables:"
  echo "  PROJECT_ID:     Google Project ID"
  echo ""
  echo "Usage tooling/fetch.sh [owner] [dev|test|stg|prod]"
}
printUsageAndExit() {
  printUsage
  exit
}

exitWithError() {
    echo "$1" 1>&2
    exit 1
}

if [ "$PROJECT_ID" = "" ]; then
  echo -e "${C_RED}No Google Project ID defined!${NC}"
  printUsageAndExit
fi

if [ "$KEY" = "" ]; then
  echo -e "${C_RED}No KeyChain defined!${NC}"
  printUsageAndExit
fi

if [ "$RING" = "" ]; then
  echo -e "${C_RED}No Ring defined!${NC}"
  printUsageAndExit
fi

TARGET_PATHNAME="$KEY/$RING"

mkdir -p $CONTENTS_DIR/$KEY

echo "Fetching secrets for $TARGET_PATHNAME..."
gsutil -m cp -r gs://$PROJECT_ID-$KEY-secrets/$RING $CONTENTS_DIR/$KEY/ 2> /dev/null

if [ ! -d "$CONTENTS_DIR/$TARGET_PATHNAME" ]; then
  exitWithError "failed to copy $CONTENTS_DIR/$TARGET_PATHNAME from GCS!"
fi
FILES=$(find $CONTENTS_DIR/$TARGET_PATHNAME -type f -name "*.enc")
for file in $FILES; do
  echo "processing file ${file##*/}"
  gcloud kms decrypt \
  --project=$PROJECT_ID \
  --location=global \
  --keyring=$RING \
  --key=$KEY \
  --ciphertext-file=$file \
  --plaintext-file=${file%.enc}
  rm $file
done

echo "You can find the secrets from $CONTENTS_DIR/$TARGET_PATHNAME"

echo -e "${C_GREEN}Finished!${NC}"
