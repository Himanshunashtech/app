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
- `GET /api/v1/chats/contacts` -> contact directory for starting new chats.
- `POST /api/v1/chats` -> authenticated chat creation by contact.
- `GET /api/v1/chats` -> authenticated chat summaries.
- `GET /api/v1/chats/{chat_id}/messages` -> authenticated message history.
- `POST /api/v1/chats/messages` -> authenticated message send path.
- `GET /api/v1/social/statuses`, `POST /api/v1/social/statuses` -> authenticated status timeline + publish.
- `GET /api/v1/social/calls`, `POST /api/v1/social/calls` -> authenticated call history + call create.
- `GET /api/v1/social/profile`, `PUT /api/v1/social/profile` -> authenticated profile read/update.

## Scale strategy
- Deploy API replicas behind L4/L7 load balancer.
- Use Redis adapter for Socket.IO for cross-node room fanout.
- Use Mongo replica sets + shard-by-chat-key for write/read scaling.
- Add Kafka for async notifications/media pipelines.
