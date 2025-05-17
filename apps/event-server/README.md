# Event Server (이벤트 보상 플랫폼)

본 Event Server는 이벤트 관리 플랫폼의 마이크로서비스 아키텍처(MSA) 구성 요소 중 하나로, 이벤트 생성/관리, 보상 정의, 사용자 이벤트 참여 및 보상 요청 처리 기능을 담당합니다. NestJS 프레임워크를 기반으로 하며 MongoDB를 데이터베이스로 사용합니다.

## 1. 주요 기능

*   **이벤트 관리 (`EventsModule`):**
    *   이벤트 생성, 조회 (페이지네이션, 필터링, 정렬), 수정, 논리적 삭제.
    *   이벤트 상태(`SCHEDULED`, `ACTIVE`, `ENDED`, `CANCELLED`) 관리 및 상태 전이 규칙 적용.
    *   생성자(`createdBy`), 수정자(`updatedBy`), 삭제자(`deletedBy`) 정보 기록.
*   **보상 관리 (`RewardsModule`):**
    *   특정 이벤트에 연동된 보상(포인트, 아이템, 쿠폰 등) 생성, 조회 (페이지네이션, 필터링, 정렬), 수정, 논리적 삭제.
    *   보상 유형(`POINT`, `ITEM`, `COUPON`)에 따른 필요 필드(예: `itemCode`, `couponCode`) 관리.
    *   생성자(`createdBy`), 수정자(`updatedBy`), 삭제자(`deletedBy`) 정보 기록.
    *   연결된 이벤트의 상태에 따른 보상 생성/수정 제한.
*   **사용자 보상 요청 관리 (`UserRewardsModule` - 향후 개발 예정):**
    *   사용자의 이벤트 조건 달성 여부 검증 및 보상 요청 처리.
    *   보상 요청 상태(`REQUESTED`, `VALIDATED`, `REWARDED`, `FAILED` 등) 관리.
    *   중복 보상 요청 방지.
*   **보상 지급 내역 조회 (향후 개발 예정):**
    *   사용자 본인 또는 운영자/감사자의 전체 사용자 보상 지급/요청 이력 조회.

## 2. API Endpoints

*   전역 접두사: `/api/v1`
*   Swagger API 문서: `/api/v1/api-docs` (서버 실행 후 접근 가능)

### 2.1. Events API (`/api/v1/events`)

*   `POST /`: 새 이벤트 생성
*   `GET /`: 모든 이벤트 조회 (페이지네이션, 필터링, 정렬 지원)
*   `GET /:id`: 특정 이벤트 상세 조회
*   `PATCH /:id`: 특정 이벤트 수정
*   `DELETE /:id`: 특정 이벤트 논리적 삭제

### 2.2. Rewards API (`/api/v1/rewards`)

*   `POST /`: 새 보상 생성 (특정 이벤트에 연결)
*   `GET /`: 모든 보상 조회 (페이지네이션, 필터링-eventId/type, 정렬 지원)
*   `GET /:id`: 특정 보상 상세 조회
*   `PATCH /:id`: 특정 보상 수정
*   `DELETE /:id`: 특정 보상 논리적 삭제

### 2.3. UserRewards API (`/api/v1/user-rewards` - 향후 개발 예정)

*   `POST /`: 사용자의 이벤트 보상 요청
*   `GET /me`: 현재 사용자의 보상 요청 내역 조회
*   `GET /admin`: (운영자/관리자) 전체 보상 요청 내역 조회

## 3. 데이터베이스 스키마 (MongoDB)

Event Server는 MongoDB를 데이터베이스로 사용하며, 주요 스키마는 다음과 같습니다.

### 3.1. `Event` 스키마 (`events` 컬렉션)

이벤트의 기본 정보를 저장합니다.

*   `_id`: `ObjectId` - MongoDB 기본 키
*   `name`: `String` - 이벤트 이름 (고유 값 권장)
*   `description`: `String` (Optional) - 이벤트 상세 설명
*   `condition`: `String` - 이벤트 참여 조건 또는 보상 달성 조건
*   `startDate`: `Date` - 이벤트 시작 일시
*   `endDate`: `Date` - 이벤트 종료 일시
*   `status`: `String` (Enum: `EventStatus` - `SCHEDULED`, `ACTIVE`, `ENDED`, `CANCELLED`) - 이벤트 현재 상태
*   `createdBy`: `String` (Optional) - 이벤트를 생성한 사용자 ID
*   `updatedBy`: `String` (Optional) - 이벤트를 마지막으로 수정한 사용자 ID
*   `deletedAt`: `Date` (Optional, default: `null`) - 논리적 삭제 일시 (null이면 삭제되지 않음)
*   `deletedBy`: `String` (Optional, default: `null`) - 이벤트를 삭제한 사용자 ID
*   `createdAt`: `Date` - 문서 생성 일시 (Mongoose `timestamps`)
*   `updatedAt`: `Date` - 문서 마지막 업데이트 일시 (Mongoose `timestamps`)
*   **주요 인덱스:**
    *   `{ name: 1, deletedAt: 1 }`
    *   `{ status: 1, startDate: -1, endDate: -1, deletedAt: 1 }`
    *   `{ endDate: 1, status: 1, deletedAt: 1 }`
    *   `{ deletedAt: 1 }`

### 3.2. `Reward` 스키마 (`rewards` 컬렉션)

이벤트에 연결된 개별 보상 정보를 저장합니다.

*   `_id`: `ObjectId` - MongoDB 기본 키
*   `eventId`: `ObjectId` (Ref: `Event`) - 연결된 이벤트의 `_id`
*   `name`: `String` - 보상 이름
*   `type`: `String` (Enum: `RewardType` - `POINT`, `ITEM`, `COUPON`) - 보상 타입
*   `quantity`: `Number` - 보상 수량
*   `description`: `String` (Optional) - 보상에 대한 추가 설명
*   `itemCode`: `String` (Optional) - `type`이 `ITEM`일 경우, 게임 내 아이템 식별 코드
*   `couponCode`: `String` (Optional) - `type`이 `COUPON`일 경우, 쿠폰 식별 코드
*   `createdBy`: `String` (Optional) - 보상을 생성한 사용자 ID
*   `updatedBy`: `String` (Optional) - 보상을 마지막으로 수정한 사용자 ID
*   `deletedAt`: `Date` (Optional, default: `null`) - 논리적 삭제 일시
*   `deletedBy`: `String` (Optional, default: `null`) - 보상을 삭제한 사용자 ID
*   `createdAt`: `Date` - 문서 생성 일시
*   `updatedAt`: `Date` - 문서 마지막 업데이트 일시
*   **주요 인덱스:**
    *   `{ eventId: 1, type: 1, deletedAt: 1 }`
    *   `{ type: 1, deletedAt: 1 }`
    *   `{ deletedAt: 1 }`

### 3.3. `UserRewardEntry` 스키마 (`user_reward_entries` 컬렉션)

사용자의 이벤트 참여 및 보상 요청/지급 상태를 기록합니다.

*   `_id`: `ObjectId` - MongoDB 기본 키
*   `userId`: `String` - 보상을 요청한 사용자의 ID
*   `eventId`: `ObjectId` (Ref: `Event`) - 참여/요청한 이벤트의 `_id`
*   `status`: `String` (Enum: `UserRewardEntryStatus`) - 요청 처리 상태
*   `validatedAt`: `Date` (Optional) - 조건 검증 완료 일시
*   `rewardedAt`: `Date` (Optional) - 보상 지급 완료 일시
*   `failureReason`: `String` (Optional) - 실패 사유
*   `grantedRewards`: `Array<ObjectId>` (Ref: `Reward`, Optional) - 지급된 `Reward`의 `_id` 목록
*   `grantedRewardDetails`: `Object` (Optional) - 지급된 보상의 상세 내용 스냅샷
*   `createdAt`: `Date` - 문서 생성 일시
*   `updatedAt`: `Date` - 문서 마지막 업데이트 일시
*   **주요 인덱스:** (변경 없음)
    *   `{ userId: 1, eventId: 1 }` (unique)
    *   `{ status: 1, updatedAt: -1 }`

### 3.4. 스키마 관계도 (ERD)

```mermaid
erDiagram
    Event ||--o{ Reward : "has multiple"
    Event ||--o{ UserRewardEntry : "has entries for"
    UserRewardEntry }o--|| Reward : "can grant"

    Event {
        ObjectId _id PK
        String name "이름"
        String description "설명 (opt)"
        String condition "조건"
        Date startDate "시작일"
        Date endDate "종료일"
        EventStatus status "상태"
        String createdBy "생성자ID (opt)"
        String updatedBy "수정자ID (opt)"
        Date deletedAt "삭제일시 (opt)"
        String deletedBy "삭제자ID (opt)"
        Date createdAt
        Date updatedAt
    }

    Reward {
        ObjectId _id PK
        ObjectId eventId FK "Event ID"
        String name "이름"
        RewardType type "타입"
        Number quantity "수량"
        String description "설명 (opt)"
        String itemCode "아이템코드 (opt)"
        String couponCode "쿠폰코드 (opt)"
        String createdBy "생성자ID (opt)"
        String updatedBy "수정자ID (opt)"
        Date deletedAt "삭제일시 (opt)"
        String deletedBy "삭제자ID (opt)"
        Date createdAt
        Date updatedAt
    }

    UserRewardEntry {
        ObjectId _id PK
        String userId "사용자 ID"
        ObjectId eventId FK "Event ID"
        UserRewardEntryStatus status "상태"
        Date validatedAt "검증일 (opt)"
        Date rewardedAt "지급일 (opt)"
        String failureReason "실패사유 (opt)"
        ObjectId[] grantedRewards FK "지급된 Reward IDs (opt)"
        Object grantedRewardDetails "지급보상 상세 (opt)"
        Date createdAt
        Date updatedAt
    }

    %% Enum Definitions for clarity (Mermaid doesn't directly support Enums in ERD attributes)
    %% EventStatus: SCHEDULED, ACTIVE, ENDED, CANCELLED
    %% RewardType: POINT, ITEM, COUPON
    %% UserRewardEntryStatus: REQUESTED, PENDING_VALIDATION, VALIDATION_FAILED, PENDING_PAYOUT, REWARDED, FAILED_PAYOUT, DUPLICATE_REQUEST
```

## 4. 모듈별 상세 설명

### 4.1. `EventsModule`

이벤트의 생성, 조회, 수정, 삭제 등 이벤트 자체의 생명주기를 관리합니다.

*   **주요 기능:**
    *   **생성 (`POST /`)**: `CreateEventDto`를 사용하여 새 이벤트 등록. `createdBy` 자동 설정. 날짜 유효성 검증.
    *   **전체 조회 (`GET /`)**: `FindAllEventsQueryDto`를 사용하여 페이지네이션, 필터링(이름, 상태, 시작/종료일 범위), 정렬 지원. 논리적으로 삭제되지 않은 이벤트만 조회.
    *   **단일 조회 (`GET /:id`)**: ID로 특정 이벤트 상세 정보 조회. 논리적으로 삭제되지 않은 이벤트만 조회.
    *   **수정 (`PATCH /:id`)**: `UpdateEventDto`를 사용하여 특정 이벤트 정보 수정. `updatedBy` 자동 설정. 상태 변경 시 정해진 규칙(예: `ENDED`->`ACTIVE` 불가) 적용. 날짜 유효성 검증. 논리적으로 삭제되지 않은 이벤트만 수정 가능.
    *   **삭제 (`DELETE /:id`)**: 특정 이벤트를 논리적으로 삭제 (`deletedAt`, `deletedBy` 필드 설정).
*   **주요 DTOs:**
    *   `CreateEventDto`: 이벤트 이름, 설명, 조건, 시작/종료일, 초기 상태 등.
    *   `UpdateEventDto`: `CreateEventDto`의 부분 집합.
    *   `FindAllEventsQueryDto`: 페이지, 제한, 정렬 기준/순서, 이름/상태/날짜 필터.
*   **주요 로직:**
    *   날짜 문자열 자동 `Date` 객체 변환 (서비스 레벨).
    *   Mongoose 스키마 레벨 `pre('save')` 훅을 통한 시작일/종료일 순서 유효성 검증.
    *   업데이트 시 서비스 레벨에서 상태 전이 유효성 및 날짜 순서 유효성 명시적 검증.

### 4.2. `RewardsModule`

각 이벤트에 연결될 수 있는 다양한 유형의 보상을 관리합니다.

*   **주요 기능:**
    *   **생성 (`POST /`)**: `CreateRewardDto`를 사용하여 특정 이벤트에 새 보상 등록. `createdBy` 자동 설정. 연결될 이벤트의 존재 및 상태(예: `ENDED`, `CANCELLED` 상태가 아님) 검증. 보상 유형(`POINT`, `ITEM`, `COUPON`)에 따른 `itemCode`, `couponCode` 필수 여부 및 조건부 유효성 검증.
    *   **전체 조회 (`GET /`)**: `FindAllRewardsQueryDto`를 사용하여 페이지네이션, 필터링(이벤트 ID, 보상 유형), 정렬 지원. 논리적으로 삭제되지 않은 보상만 조회. 연결된 이벤트 정보 일부(`name`, `status`)를 `populate`하여 함께 반환.
    *   **단일 조회 (`GET /:id`)**: ID로 특정 보상 상세 정보 조회. 논리적으로 삭제되지 않은 보상만 조회. 연결된 이벤트 정보 `populate`.
    *   **수정 (`PATCH /:id`)**: `UpdateRewardDto`를 사용하여 특정 보상 정보 수정. `updatedBy` 자동 설정. `eventId` 변경 시 새 이벤트 유효성/상태 검증. `type` 변경 시 관련 필드 유효성 검증. 연결된 이벤트가 `ENDED` 또는 `CANCELLED` 상태일 경우 주요 보상 내용 수정 제한. 논리적으로 삭제되지 않은 보상만 수정 가능.
    *   **삭제 (`DELETE /:id`)**: 특정 보상을 논리적으로 삭제 (`deletedAt`, `deletedBy` 필드 설정).
*   **주요 DTOs:**
    *   `CreateRewardDto`: 보상 이름, 유형, 수량, 설명(선택), 아이템/쿠폰 코드(유형 따라 선택/필수), 연결될 이벤트 ID.
    *   `UpdateRewardDto`: `CreateRewardDto`의 부분 집합.
    *   `FindAllRewardsQueryDto`: 페이지, 제한, 정렬 기준/순서, 이벤트 ID/보상 유형 필터.
*   **주요 로직:**
    *   `EventsService`를 주입받아 이벤트 관련 유효성 검증에 활용.
    *   MongoDB ObjectId 유효성 검증.

### 4.3. `UserRewardsModule` (향후 개발 예정)

사용자의 이벤트 참여 및 보상 획득 과정을 관리합니다. (상세 내용은 추후 설계)

## 5. 환경 변수

Event Server 실행에 필요한 주요 환경 변수는 다음과 같습니다. 상세 내용은 `apps/event-server/.env.example` 파일을 참고하십시오.

*   `EVENT_SERVER_PORT`: Event Server 실행 포트 (기본값: 3002)
*   `EVENT_MONGODB_URI`: MongoDB 연결 URI
*   `EVENT_MONGODB_DB_NAME`: 사용할 MongoDB 데이터베이스 이름
*   `JWT_SECRET`: JWT 검증을 위한 비밀 키 (Gateway Server, Auth Server와 동일해야 함)

## 6. 설정 및 실행 방법 (기본)

1.  **의존성 설치:**
    ```bash
    # 프로젝트 루트에서 전체 의존성 설치 (최초 1회 또는 필요시)
    # yarn install

    # Event Server 개별 의존성 설치 (필요시)
    cd apps/event-server
    yarn install
    ```
2.  **환경 변수 설정:**
    *   `apps/event-server` 디렉토리에 `.env.development` (또는 해당 환경의 `.env` 파일)을 생성하고 위 "5. 환경 변수" 섹션을 참고하여 값을 설정합니다. (MongoDB URI, DB 이름, JWT 시크릿 등)
3.  **개발 모드 실행:**
    ```bash
    # apps/event-server 디렉토리에서 실행
    yarn start:dev event-server
    ```
    또는 프로젝트 루트에서:
    ```bash
    yarn start:dev event-server
    ```
    서버가 정상적으로 실행되면 설정된 포트(기본 3002)로 API 요청을 받을 수 있습니다. Swagger UI는 `/api/v1/api-docs` 경로에서 접근 가능합니다.

## 7. 향후 개선 및 고려 사항

*   **`UserRewardsModule` 개발**: 사용자 이벤트 참여, 조건 검증, 보상 지급 요청 처리 로직 구현.
*   **트랜잭션 관리**: 여러 DB 작업이 포함되는 로직(예: 사용자 보상 지급 시 상태 업데이트 및 보상 내역 기록)에 대해 MongoDB 트랜잭션을 적용하여 데이터 일관성 보장.
*   **메시지 큐 연동 (선택 사항)**: 보상 지급과 같이 시간이 오래 걸리거나 외부 시스템 연동이 필요한 작업은 메시지 큐(예: RabbitMQ, Kafka)를 통해 비동기 처리하여 응답성 향상 및 시스템 안정성 증대.
*   **테스트 커버리지 확대**: 각 모듈의 서비스 로직, 컨트롤러, DTO 유효성 검사 등에 대한 단위 테스트 및 통합 테스트 코드 작성.
*   **로깅 상세화**: Winston, Pino 등 전문 로깅 라이브러리 도입 및 요청 ID(Correlation ID) 기반 로깅으로 MSA 환경에서의 추적 용이성 확보.
*   **보안 강화**: 입력값 검증 강화, 인가 로직 세분화 (예: 특정 사용자만 본인의 보상 내역 조회 가능), 주요 작업에 대한 감사 로그 기록.
*   **성능 최적화**: DB 쿼리 최적화, 필요한 곳에 캐싱 전략 도입.

## 8. 트러블슈팅

(Event Server 개발 및 운영 중 발생할 수 있는 일반적인 문제점들을 추후 기록)

*   **MongoDB 연결 오류**: `EVENT_MONGODB_URI` 또는 `EVENT_MONGODB_DB_NAME` 환경 변수 확인, MongoDB 서버 상태 및 네트워크 확인.
*   **JWT 인증 오류**: Gateway로부터 전달받는 `X-User-*` 헤더가 올바르게 파싱되는지, 또는 `JWT_SECRET`이 Gateway/Auth Server와 일치하는지 확인 (Event Server는 직접 JWT를 검증하지 않고 Gateway를 신뢰하는 구조).
*   **데이터 유효성 검사 실패**: DTO의 `class-validator` 규칙 및 서비스 레벨의 유효성 검사 로직 확인. API 요청 시 파라미터가 올바르게 전달되는지 Swagger UI 또는 Postman 등으로 확인.
*   **잘못된 ObjectId 참조**: `eventId` 등으로 다른 문서를 참조할 때, 해당 ID가 유효한 ObjectId 형식이거나 실제로 존재하는 문서인지 확인.