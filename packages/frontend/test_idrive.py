#!/usr/bin/env python3
import boto3
from botocore.config import Config

# Your credentials - REPLACE WITH YOUR ACTUAL SECRET KEY
s3 = boto3.client(
    's3',
    endpoint_url='https://s3.eu-central-2.idrivee2.com',
    aws_access_key_id='C983DF2D1B7A691F82EA99F7FE2D986682C4FFA5',
    aws_secret_access_key='YOUR-SECRET-KEY-HERE',  # 🔴 REPLACE THIS!
    region_name='eu-central-2',
    config=Config(signature_version='s3v4')
)

# Test 1: List buckets
print("🔍 Testing IDrive e2 connection...")
print("-" * 40)

try:
    response = s3.list_buckets()
    print("✅ Connection successful!")
    if 'Buckets' in response and response['Buckets']:
        print("📦 Your buckets:")
        for bucket in response['Buckets']:
            print(f"   - {bucket['Name']}")
    else:
        print("📦 No buckets found yet")
except Exception as e:
    print("❌ Connection failed:", str(e))
    exit(1)

print("-" * 40)

# Test 2: Check if your specific buckets exist
buckets_to_check = ['traproyalties-private', 'traproyalties-public']
print("🔍 Checking required buckets...")

for bucket in buckets_to_check:
    try:
        s3.head_bucket(Bucket=bucket)
        print(f"✅ Bucket '{bucket}' exists and is accessible")
    except Exception as e:
        print(f"⚠️  Bucket '{bucket}' doesn't exist or isn't accessible")
        print(f"   Error: {e}")

print("-" * 40)
print("✅ Test complete!")
