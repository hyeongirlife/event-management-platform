/**
 * 사용자 역할 및 권한:
 *
 * USER: 보상 요청 가능
 * OPERATOR: 이벤트/보상 등록 가능
 * AUDITOR: 보상 이력 조회만 가능
 * ADMIN: 모든 기능 접근 가능
 */
export enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}
