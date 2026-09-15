# 플래닛 버스 노선 챌린지 - 운영 설정 메모

## 게임 구조
- 노선 선택: 9007 / 1007-1 / 4500 / 315
- 각 노선은 출발 정류장 + SK플래닛 + 도착 정류장 + 퀴즈 8개 = 총 11개 노드
- 제한시간: 15초
- 오답 선택지는 딤드 처리되고 남은 선택지로 재도전
- 15초 안에 8개 정답 완료 시 성공 및 1P 대상
- 시간 초과 시 실패 후 광고 인터스티셜 노출

## Bridge
- START: gameId `planet-bus-route-challenge`
- COMPLETE 성공 resultCode: `CLEAR_15SEC`
- COMPLETE 실패 resultCode: `TIMEOUT`
- Benefit ID: `planet-bus-route-point`
- 성공에만 1P claim 가능

## 광고
현재 배포본은 광고 SDK가 연결되지 않은 테스트용 인터스티셜 UI를 사용합니다.
실운영 광고 API가 정해지면 `showAd()` 함수를 실제 광고 호출로 교체하세요.
