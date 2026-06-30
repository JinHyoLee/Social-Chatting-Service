# chattting app

Express + Socket.IO + MySQL 기반 실시간 채팅·친구 기능 웹 앱 (TypeScript, 모노리스)

## 기술 스택

| 구분   | 기술                                 |
| :----- | :----------------------------------- |
| 백엔드 | Express, Socket.IO                   |
| 프론트 | TypeScript, Webpack, 바닐라 HTML/CSS |
| DB     | MySQL (로컬)                         |
| 실행   | ts-node, nodemon                     |

## 현재 프로젝트 구조

Express 서버 하나가 API + 정적 파일 서빙을 같이 하고, 브라우저는 그 서버에서 HTML/JS를 받아 씁니다.

### 한 줄 구조

```
src/ → webpack → dist/ (bundle.js, index.html)
app.ts → Express가 dist/ + src/pages + src/css 서빙
```

### 폴더 구조

```
├── app.ts                 # Express API · Socket.IO · MySQL
├── package.json           # npm scripts · 의존성
├── tsconfig.json          # TypeScript 설정 (프론트·백 공용)
├── webpack.config.js      # 프론트 빌드 설정 (webpack용)
├── src/                   # 프론트 소스
│   ├── main.ts            # SPA 진입점, nav 클릭 시 페이지 전환
│   ├── index.html         # HtmlWebpackPlugin 템플릿
│   ├── script/            # Login, Rooms, Users, Friends (TS)
│   ├── pages/             # HTML 조각 — 개발 시 Express `/pages`로 서빙
│   └── css/               # 스타일 — 개발 시 Express `/css`로 서빙
└── dist/                  # 프론트 배포용 파일: Webpack 빌드 결과(bundle.js, index.html), 나머지 html과 css는 배포시 src에서 복사해 옴
```

### 동작 흐름

1. `npm run front` → `src/main.ts` → `dist/bundle.js` (watch, development)
2. `npm run back` → nodemon + ts-node로 `app.ts` 실행 (기본 `:5001`)
3. 브라우저 접속 → Express가 `dist/`(HTML·JS), `src/pages`, `src/css` 제공
4. 프론트 → `fetch('/login')`, `fetch('/api/users/...')` 등으로 같은 서버 API 호출
5. 채팅 → Socket.IO로 실시간 통신

### 프론트 페이지 전환

라우터 없이 HTML 조각을 `fetch` → `.main`에 `innerHTML`로 교체합니다.

| nav id  | HTML 파일            | 초기화 함수               |
| :------ | :------------------- | :------------------------ |
| (시작)  | `pages/login.html`   | `loginInit`, `signUpInit` |
| Rooms   | `pages/Rooms.html`   | `roomEnter`               |
| Users   | `pages/Users.html`   | `usersInit`               |
| Friends | `pages/Friends.html` | `friendsInit`             |
| Logout  | `pages/login.html`   | `init`                    |

### 명령어

| 명령            | 설명                                                            |
| :-------------- | :-------------------------------------------------------------- |
| `npm install`   | 의존성 설치                                                     |
| `npm run build` | Webpack(production) + `copy` → `dist/` 전체 생성                |
| `npm run copy`  | `src/pages`, `src/css` → `dist/` 복사 (배포용)                  |
| `npm run front` | Webpack watch(development) — TS 저장 시 `bundle.js` 자동 재빌드 |
| `npm run back`  | nodemon + ts-node — `app.ts` 저장 시 서버 자동 재시작           |
| `npm start`     | `node ./dist/app.js` (백엔드 컴파일 후 프로덕션용, 현재 미설정) |

**로컬 개발:** 터미널 2개 — `npm run back` + `npm run front`. TS 수정은 새로고침, HTML/CSS(`src/pages`, `src/css`)는 저장 후 새로고침.

**최초 실행:** `dist/`가 없으면 `npm run build` 또는 `npm run front`를 먼저 실행해 `bundle.js`, `index.html`을 만듭니다.

### 정리

- 별도 프론트/백 repo가 아님 — 한 repo, 한 서버 (모노리스)
- 배포: `npm run build` 후 Express가 `dist/` 정적 파일 + API 처리

---

## 실행 방법

### 1. MySQL 설치 및 실행
### 2. DB · 계정 · 테이블 생성

root로 MySQL 접속 후:

```sql
CREATE DATABASE IF NOT EXISTS chat;

CREATE USER 'admin'@'localhost' IDENTIFIED BY '1234';
CREATE USER 'admin'@'127.0.0.1' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON chat.* TO 'admin'@'localhost';
GRANT ALL PRIVILEGES ON chat.* TO 'admin'@'127.0.0.1';
FLUSH PRIVILEGES;

USE chat;

CREATE TABLE usertable (
  username VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendtable (
  username VARCHAR(255) NOT NULL,
  friendname VARCHAR(255) NOT NULL
);

CREATE TABLE friendrequests (
  username VARCHAR(255) NOT NULL,
  friendname VARCHAR(255) NOT NULL
);

-- 테스트 계정 (선택)
INSERT INTO usertable (username, password) VALUES ('test', '1234');
INSERT INTO usertable (username, password) VALUES ('user2', '1234');
```

접속 확인:

```bash
mysql -u admin -p1234 chat
```

### 3. `app.ts` DB 연결

```typescript
host: 'localhost',
port: 3306,
user: 'admin',
password: '1234',
database: 'chat',
```

> MySQL 8/9는 `mysql2` 패키지 필요 (구 `mysql` 패키지는 인증 방식 미지원)

### 4. 앱 실행

```bash
npm install
npm run build    # 최초 1회 (dist/ 생성)
```

터미널 2개:

```bash
# 터미널 1 — 백엔드
npm run back

# 터미널 2 — 프론트 (Webpack watch)
npm run front
```

브라우저: **http://localhost:5000**

포트 충돌 시: `PORT=5001 npm run back`

---

## DB

### 테이블

| 테이블           | 컬럼                            | 용도                                     |
| :--------------- | :------------------------------ | :--------------------------------------- |
| `usertable`      | username, password, dateCreated | 회원 (웹 로그인용)                       |
| `friendtable`    | username, friendname            | 친구 관계 (양방향 2행)                   |
| `friendrequests` | username, friendname            | username=받는 사람, friendname=보낸 사람 |

> MySQL `admin` 계정 = 앱↔DB 연결용 / `usertable.username` = 웹 로그인 ID (별개)

---

## API 개요

클라이언트↔서버 통신은 **HTTP(REST)** 와 **Socket.IO** 두 가지입니다.

| 구분   | HTTP (REST)                     | Socket.IO            |
| :----- | :------------------------------ | :------------------- |
| 용도   | 로그인, 유저·친구 CRUD, 방 목록 | 채팅, 방 입·퇴장     |
| 저장   | MySQL                           | 메모리 (`roomData`)  |
| 프론트 | `fetch()`                       | `io('/socket/chat')` |
| 인증   | 없음                            | 없음                 |

```
[로그인·친구·유저]  ──HTTP──►  Express REST  ──►  MySQL
[채팅·입퇴장]      ──Socket──►  /socket/chat  ──►  roomData
```

**Base URL:** `http://localhost:5001` · **Socket namespace:** `/socket/chat`

---

## HTTP API

### 엔드포인트

| Method | URL                                    | 사용 용도           | Request / Params            | Response                                  |
| :----: | :------------------------------------- | :------------------ | :-------------------------- | :---------------------------------------- |
|  POST  | `/login`                               | 로그인              | body `{ id, password }`     | `{ result }` — OK/Fail/None/Error         |
|  POST  | `/signUp`                              | 회원가입            | body `{ id, password }`     | `{ result }` — OK/Fail/None               |
|  GET   | `/api/users/:userId`                   | 전체 유저 목록 조회 | path `:userId`              | `[{ id, date, friendNum, isFriend }]`     |
|  GET   | `/api/reqfriends/:userId/:friendId`    | 친구 요청 보내기    | path `:userId`, `:friendId` | `{ result: "OK" }`                        |
|  GET   | `/api/reqfriends/:userId`              | 친구 요청 수신함    | path `:userId`              | `[{ id, date }]` — `id`=요청 보낸 사람    |
|  GET   | `/api/acceptfriends/:userId/:friendId` | 친구 요청 수락      | path `:userId`, `:friendId` | `{ result: "OK" }`                        |
|  GET   | `/api/rejectfriends/:userId/:friendId` | 친구 요청 거절      | path `:userId`, `:friendId` | `{ result: "OK" }`                        |
|  GET   | `/api/friends/:userId`                 | 친구 목록 조회      | path `:userId`              | `[{ id, date }]` — `id`=친구 username     |
|  GET   | `/api/deletefriends/:userId/:friendId` | 친구 삭제           | path `:userId`, `:friendId` | `{ result: "OK" }`                        |
|  GET   | `/api/rooms`                           | 채팅방·참여자 조회  | —                           | `[{ id, members[] }]` — id `"1"` \| `"2"` |

### 공통 규칙

| 항목         | 내용                                           |
| :----------- | :--------------------------------------------- |
| 인증         | 세션/JWT 없음 — `:userId`를 URL에 직접 전달    |
| HTTP 상태    | 실패도 200 — body로 구분                       |
| Content-Type | POST(`/login`, `/signUp`)만 `application/json` |
| REST         | 친구 변경 API가 GET — POST/DELETE 권장         |

### Request / Params

엔드포인트 표의 `body` · `path` 상세 설명입니다.

| 대상                                   | 파라미터               | 설명                                        |
| :------------------------------------- | :--------------------- | :------------------------------------------ |
| POST `/login`, `/signUp`               | body `id`              | username                                    |
| POST `/login`, `/signUp`               | body `password`        | 평문                                        |
| `/api/users/:userId`                   | `:userId`              | 조회 주체(본인). **응답에서 본인 제외**     |
| `/api/reqfriends/:userId/:friendId`    | `:userId`, `:friendId` | 요청 보낸 사람 / 받는 사람                  |
| `/api/reqfriends/:userId`              | `:userId`              | 수신함 주체(나). 응답 `id`는 요청 보낸 사람 |
| `/api/acceptfriends`, `/rejectfriends` | `:userId`, `:friendId` | 수신자(나) / 요청 보낸 사람                 |
| `/api/friends/:userId`                 | `:userId`              | 친구 목록 주체(본인)                        |
| `/api/deletefriends/:userId/:friendId` | `:userId`, `:friendId` | 본인 / 삭제할 친구                          |
| `/api/rooms`                           | —                      | 파라미터 없음                               |

### result

| 값    | 의미                                   |
| :---- | :------------------------------------- |
| OK    | 성공                                   |
| Fail  | 실패 (로그인 불일치, username 중복 등) |
| None  | 입력값 누락                            |
| Error | DB 오류 (`/login`만)                   |

### 응답 필드

| 필드        | 설명                                  |
| :---------- | :------------------------------------ |
| `id`        | username                              |
| `date`      | 가입일 `YYYY-MM-DD`                   |
| `friendNum` | 친구 수 (Users만, 없으면 0)           |
| `isFriend`  | true면 "친구요청" 버튼 숨김 (Users만) |
| `members`   | 방 참여 username 배열 (Rooms)         |

## Socket.IO API

| 항목      | 내용                                   |
| :-------- | :------------------------------------- |
| Namespace | `/socket/chat`                         |
| 연결      | `io('/socket/chat')` — `Rooms.ts`      |
| 방 ID     | `"1"` 또는 `"2"` (문자열)              |
| 상태      | `app.ts` `roomData` — 재시작 시 초기화 |
| 인증      | 없음                                   |

### 리스너 등록

- `socket.on(이벤트, 함수)`는 **이 이벤트가 오면 이 함수를 실행해라**고 미리 등록하는 것입니다.
- 서버는 클라이언트가 **연결될 때**,
- 클라이언트는 채팅 페이지를 **열 때** 한 번 등록합니다.
- 이후 상대가 `emit`으로 보내면, 등록해 둔 함수가 자동으로 실행됩니다.

**서버 (`app.ts`)**

| 리스너       | 설명                                                     |
| :----------- | :------------------------------------------------------- |
| `join-room`  | 방 입장 — `roomData` 갱신, `join` 후 S→C 알림·인원 갱신  |
| `leave-room` | 방 퇴장 — `roomData` 갱신, S→C 알림·인원 갱신 후 `leave` |
| `chatting`   | 채팅 수신 — 같은 방 다른 클라이언트로 relay              |

**클라이언트 (`Rooms.ts`)**

| 리스너           | 설명                                           |
| :--------------- | :--------------------------------------------- |
| `chatting`       | 입·퇴장 알림 및 채팅 메시지를 채팅 목록에 표시 |
| `refresh-member` | 참여 인원 목록 UI 갱신                         |

