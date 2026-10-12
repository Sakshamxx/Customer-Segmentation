import os
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from ..rag.retriever import retrieve

llm = ChatMistralAI(model=os.getenv("MISTRAL_MODEL", "mistral-small-latest"), temperature=0.2)

def format_docs(docs):
    return "\n\n".join(f"[{d['source']}]\n{d['content']}" for d in docs)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer using only the context. If it is not there, say so."),
    ("human", "Context:\n{context}\n\nQuestion: {question}"),
])

rag_chain = (
    {"context": RunnableLambda(retrieve) | format_docs,
     "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)
# rag_chain.invoke("What defines cluster 2?")