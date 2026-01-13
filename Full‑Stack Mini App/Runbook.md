# 1) Install
npm i


# 2) Run locally
npm run dev
# App: http://localhost:3000


# 3) Verify with curl (or Postman)
# Create
curl -X POST http://localhost:3000/api/tasks \
-H 'Content-Type: application/json' \
-d '{"name":"Write assignment"}'


# List
curl http://localhost:3000/api/tasks


# Update
curl -X PATCH http://localhost:3000/api/tasks/1 \
-H 'Content-Type: application/json' \
-d '{"status":"DONE"}'