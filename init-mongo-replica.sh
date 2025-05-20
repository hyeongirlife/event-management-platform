#!/bin/bash
set -e

function wait_for_mongo() {
  local container=$1
  local max_retries=30
  local count=0
  echo "⏳ $container 기동 대기 중..."
  until docker exec $container mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 2
    count=$((count+1))
    if [ $count -ge $max_retries ]; then
      echo "❌ $container 기동 실패 (timeout)"
      exit 1
    fi
  done
  echo "✅ $container 기동 완료"
}

wait_for_mongo auth-db
wait_for_mongo event-db

echo "🔄 auth-db replica set 초기화"
docker exec auth-db mongosh --eval "rs.initiate()" || true

echo "🔄 event-db replica set 초기화"
docker exec event-db mongosh --eval "rs.initiate()" || true

echo "✅ MongoDB replica set 초기화 완료" 