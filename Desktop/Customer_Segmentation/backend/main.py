from .agent.agent import run_agent
from .agent.chain import rag_chain
from ..guardrails.checks import check_input, redact   # adjust the import to your layout

@app.post("/ask")
def ask(q: Question):
    return {"answer": redact(rag_chain.invoke(check_input(q.question)))}

@app.post("/agent")
def agent_ask(q: Question):
    return {"answer": redact(run_agent(check_input(q.question)))}