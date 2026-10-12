from langgraph.prebuilt import create_react_agent
from .chain import llm
from .tools import TOOLS

agent = create_react_agent(llm, TOOLS)

def run_agent(question: str) -> str:
    result = agent.invoke(
        {"messages": [("user", question)]},
        config={"recursion_limit": 8},        # hard cap on tool-call loops
    )
    return result["messages"][-1].content