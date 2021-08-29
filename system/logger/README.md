### Create new logger

Implement "trace" method:
```
[2021.08.08 - 21:43.33.212][trace][users.add()] 1/5; before "pre hooks": [{"name":"Name Surname","email":"info@example.com"}]
[2021.08.08 - 21:43.33.213][trace][users.add()] 2/5; after "pre hooks": [{"name":"Name Surname","email":"info@example.com"}]
[2021.08.08 - 21:43.33.218][trace][users.add()] Error; "Reject" in worker code called
[2021.08.08 - 21:43.33.218][trace][users.add()] Done; ... added
```