Below is the **full public surface of Contextual AI’s v1 REST API** as of **24 Jul 2025**.
Every path is shown **relative to** `https://api.contextual.ai/v1`, grouped by resource area and paired with the canonical HTTP verb(s).

---

### Datastores (vector stores) ([Contextual AI Documentation][1], [Contextual AI Documentation][2], [Contextual AI Documentation][3], [Contextual AI Documentation][4], [Contextual AI Documentation][5])

```
GET    /datastores                       # list
POST   /datastores                       # create
PUT    /datastores/{datastore_id}        # edit name / config
PUT    /datastores/{datastore_id}/reset  # wipe all docs
DELETE /datastores/{datastore_id}        # delete
GET    /datastores/{datastore_id}/metadata
```

#### Documents inside a Datastore ([Contextual AI Documentation][6], [Contextual AI Documentation][7], [Contextual AI Documentation][8], [Contextual AI Documentation][9], [Contextual AI Documentation][10])

```
GET    /datastores/{id}/documents
POST   /datastores/{id}/documents              # ingest (multipart)
GET    /datastores/{id}/documents/{doc_id}
PUT    /datastores/{id}/documents/{doc_id}/metadata   # update custom metadata
GET    /datastores/{id}/documents/{doc_id}/metadata   # status / details
DELETE /datastores/{id}/documents/{doc_id}
```

---

### Agents (RAG workers) ([Contextual AI Documentation][11], [Contextual AI Documentation][12], [Contextual AI Documentation][13], [Contextual AI Documentation][14], [Contextual AI Documentation][15])

```
GET    /agents
POST   /agents                          # create
GET    /agents/{agent_id}               # metadata & config
PUT    /agents/{agent_id}               # edit config
PUT    /agents/{agent_id}/reset         # restore defaults
DELETE /agents/{agent_id}               # delete
```

#### Agent Query interface ([Contextual AI Documentation][16], [Contextual AI Documentation][17], [Contextual AI Documentation][18])

```
POST   /agents/{agent_id}/query
GET    /agents/{agent_id}/query/retrieval-info
POST   /agents/{agent_id}/query/feedback
GET    /agents/{agent_id}/query/metrics
```

#### Agent Tuning jobs (fine-tuning) ([Contextual AI Documentation][19])

```
POST   /agents/{agent_id}/tune                               # create tune job
GET    /agents/{agent_id}/tune/jobs/{job_id}/metadata        # job status & model_id
DELETE /agents/{agent_id}/tune/jobs/{job_id}                 # cancel job
```

#### Agent Evaluation Datasets (row-level scoring) ([Contextual AI Documentation][20])

```
GET  /agents/{agent_id}/datasets/evaluate            # list versions
POST /agents/{agent_id}/datasets/evaluate            # create / upload dataset
```

---

### Stand-alone LLM / RAG primitives

| Endpoint    | Method | Purpose                                          | Source                              |
| ----------- | ------ | ------------------------------------------------ | ----------------------------------- |
| `/generate` | POST   | Grounded Language Model (GLM) text generation    | ([Contextual AI Documentation][21]) |
| `/rerank`   | POST   | Instruction-aware, multilingual chunk re-ranking | ([Contextual AI Documentation][22]) |
| `/lmunit`   | POST   | Unit-test style scoring of LLM output            | ([Contextual AI Documentation][18]) |

---

### Parse service (doc → structured text) ([Contextual AI Documentation][23], [Contextual AI Documentation][24])

```
POST   /parse                              # upload & convert file
GET    /parse/jobs                         # list last-30-day parse jobs
GET    /parse/jobs/{job_id}/status         # polling
GET    /parse/jobs/{job_id}/results        # markdown / JSON output
```

---

### Users & Tenancy ([Contextual AI Documentation][25], [Contextual AI Documentation][26], [Contextual AI Documentation][27])

```
GET    /users                  # list / search
POST   /users                  # invite one or many
PUT    /users                  # update roles / profile
DELETE /users                  # remove user
```

---

### Quick reference for auth & base URL

```text
Base: https://api.contextual.ai/v1
Headers: 
  Authorization: Bearer <key-tBsgtQap8nle4u-D6QOoJZ6nOhHULw49S9DtX96JvS4_yr5O8>
  Content-Type: application/json   # or multipart/form-data where noted
```

> **Coverage note** – the list above mirrors every operation documented in Contextual AI’s public docs and “Tuning & Evaluation” guide as of **July 24 2025**.
> If new resources (e.g., future pipelines or dataset types) appear later, simply point me to the updated docs and I’ll refresh the catalog for you.

[1]: https://docs.contextual.ai/api-reference/datastores/list-datastores?utm_source=chatgpt.com "List Datastores - Contextual AI Documentation"
[2]: https://docs.contextual.ai/api-reference/datastores/create-datastore?utm_source=chatgpt.com "Create Datastore - Contextual AI Documentation"
[3]: https://docs.contextual.ai/api-reference/datastores/edit-datastore-configuration?utm_source=chatgpt.com "Edit Datastore Configuration - Contextual AI Documentation"
[4]: https://docs.contextual.ai/api-reference/datastores/reset-datastore?utm_source=chatgpt.com "Reset Datastore - Contextual AI Documentation"
[5]: https://docs.contextual.ai/api-reference/datastores/delete-datastore?utm_source=chatgpt.com "Delete Datastore - Contextual AI Documentation"
[6]: https://docs.contextual.ai/api-reference/datastores-documents/list-documents?utm_source=chatgpt.com "List Documents - Contextual AI Documentation"
[7]: https://docs.contextual.ai/api-reference/datastores-documents/ingest-document?utm_source=chatgpt.com "Ingest Document - Contextual AI Documentation"
[8]: https://docs.contextual.ai/api-reference/datastores-documents/get-document-metadata?utm_source=chatgpt.com "Get Document Metadata - Contextual AI Documentation"
[9]: https://docs.contextual.ai/api-reference/datastores-documents/update-document-metadata?utm_source=chatgpt.com "Update Document Metadata - Contextual AI Documentation"
[10]: https://docs.contextual.ai/api-reference/datastores-documents/delete-document?utm_source=chatgpt.com "Delete Document - Contextual AI Documentation"
[11]: https://docs.contextual.ai/api-reference/agents/list-agents?utm_source=chatgpt.com "List Agents - Contextual AI Documentation"
[12]: https://docs.contextual.ai/api-reference/agents/create-agent?utm_source=chatgpt.com "Create Agent - Contextual AI Documentation"
[13]: https://docs.contextual.ai/api-reference/agents/edit-agent?utm_source=chatgpt.com "Edit Agent - Contextual AI Documentation"
[14]: https://docs.contextual.ai/api-reference/agents/delete-agent?utm_source=chatgpt.com "Delete Agent - Contextual AI Documentation"
[15]: https://docs.contextual.ai/api-reference/agents/reset-agent?utm_source=chatgpt.com "Reset Agent - Contextual AI Documentation"
[16]: https://docs.contextual.ai/api-reference/agents-query/query?utm_source=chatgpt.com "Query - Contextual AI Documentation"
[17]: https://docs.contextual.ai/api-reference/agents-query/get-retrieval-info?utm_source=chatgpt.com "Get Retrieval Info - Contextual AI Documentation"
[18]: https://docs.contextual.ai/api-reference/lmunit/lmunit?utm_source=chatgpt.com "LMUnit - Contextual AI Documentation"
[19]: https://docs.contextual.ai/reference/tune-evaluation-guide "Tuning and Evaluation - Contextual AI Documentation"
[20]: https://docs.contextual.ai/api-reference/agents-datasetsevaluate/list-evaluation-datasets?utm_source=chatgpt.com "List Evaluation Datasets - Contextual AI Documentation"
[21]: https://docs.contextual.ai/api-reference/generate/generate?utm_source=chatgpt.com "Generate - Contextual AI Documentation"
[22]: https://docs.contextual.ai/api-reference/rerank/rerank?utm_source=chatgpt.com "Rerank - Contextual AI Documentation"
[23]: https://docs.contextual.ai/api-reference/parse/parse-file?utm_source=chatgpt.com "Parse File - Contextual AI Documentation"
[24]: https://docs.contextual.ai/api-reference/parse/parse-list-jobs?utm_source=chatgpt.com "Parse List Jobs - Contextual AI Documentation"
[25]: https://docs.contextual.ai/api-reference/users/get-users?utm_source=chatgpt.com "Get Users - Contextual AI Documentation"
[26]: https://docs.contextual.ai/api-reference/users/invite-users?utm_source=chatgpt.com "Invite Users - Contextual AI Documentation"
[27]: https://docs.contextual.ai/api-reference/users/update-user?utm_source=chatgpt.com "Update User - Contextual AI Documentation"
