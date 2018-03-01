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
  echo "Usage tooling/push.sh [owner] [dev|test|stg|prod]"
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

if [ ! -d "$CONTENTS_DIR/$TARGET_PATHNAME" ]; then
  exitWithError "$CONTENTS_DIR/$TARGET_PATHNAME does not exist locally!"
fi

mkdir -p $TMP/$KEY 2> /dev/null

echo "Updating secrets for $TARGET_PATHNAME..."
cp -r "$CONTENTS_DIR/$TARGET_PATHNAME" $TMP/$TARGET_PATHNAME
FILES=$(find $TMP/$TARGET_PATHNAME -type f -not -name "*.enc")
for file in $FILES; do
  echo "processing file ${file##*/}"
  gcloud kms encrypt \
  --project=$PROJECT_ID \
  --location=global \
  --keyring=$RING \
  --key=$KEY \
  --plaintext-file=$file \
  --ciphertext-file=$file.enc
  rm $file
done
gsutil -m cp -r $TMP/$TARGET_PATHNAME/ gs://$PROJECT_ID-$KEY-secrets/ 2> /dev/null
rm -r $TMP/$KEY

echo -e "${C_GREEN}Finished!${NC}"
