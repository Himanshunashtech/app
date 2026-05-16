# Chat backend (Python + Socket.IO + MongoDB)

## Architecture
- Stateless FastAPI + Socket.IO edge service.
- MongoDB for message durability (indexed on `chat_id`, `created_at`).
- Rate limiting and token auth at API and realtime boundaries.
- Request context middleware with request-id propagation for observability.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker compose up --build
```

## Endpoints
- `POST /auth/dev-token` -> returns `access_token` for a `user_id`.
- `GET /api/v1/chats` -> authenticated chat summaries.
- `GET /api/v1/chats/{chat_id}/messages` -> authenticated message history.
- `POST /api/v1/chats/messages` -> authenticated message send path.

## Scale strategy
- Deploy API replicas behind L4/L7 load balancer.
- Use Redis adapter for Socket.IO for cross-node room fanout.
- Use Mongo replica sets + shard-by-chat-key for write/read scaling.
- Add Kafka for async notifications/media pipelines.
