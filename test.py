curl --location 'https://api.z.ai/api/coding/paas/v4/chat/completions' \
--header 'Authorization: Bearer 86f90fe16ae34556b84f61f69bfc772c.bDA0Er5ScuCqbpEq' \
--header 'Accept-Language: en-US,en' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.5",
    "messages": [
        {
            "role": "user",
            "content": "Hello"
        }
    ]
}'