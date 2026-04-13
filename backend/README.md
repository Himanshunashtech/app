# Chat backend (Python + Socket.IO + MongoDB)

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

## Scale strategy

- Stateless API + Socket.IO servers behind load balancer.
- MongoDB replica set + sharding on `chat_id` for messages.
- Redis adapter for Socket.IO (recommended for multi-node fanout).
- Background workers for async fanout, media processing, and notification delivery.
