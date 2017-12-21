# OcelBot Emote API documentation
## Fetch Guild Emotes
`GET /api/emotes/:guild`
- guild is a Discord Guild ID

### Success Response

**Condition:** If guild exists and has emotes

**HTTP Status Code:** `200 OK`

**Content:**
```JSON
{
	"status": 1,
	"emotes": [...],
	"name": "..."
}
```
### Error response

**Condition:** If guild exists and has no emotes

**HTTP Status Code:** `200 OK`

**Content:**
```JSON
{
	"status": 0
}
```

#### OR

**Condition:** If guild does not exist

**HTTP Status Code:** `404 NOT FOUND`

**Content:**
```JSON
{}
```
