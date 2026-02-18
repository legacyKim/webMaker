import React, { useState, useMemo, useCallback } from "react";
import ReactFlow, {
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
} from "react-flow-renderer";
import { useQuery } from "react-query";
import { fetchContent } from "../api/contentApi";
import CustomNode from "../components/CustomNode";
import Loading from "../components/shared/Loading";
import { Link } from "react-router-dom";

export default function ContentMap() {
  const { data, isLoading, error } = useQuery("contentData", fetchContent, {
    refetchInterval: 120000,
    retry: false,
  });

  // 에러 시 명확한 에러 표시
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "20px",
          color: "#dc3545",
        }}
      >
        <h2>🚨 API 연결 오류</h2>
        <p>서버와의 연결에 실패했습니다.</p>
        <pre
          style={{
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "5px",
            fontSize: "14px",
            maxWidth: "600px",
            overflow: "auto",
          }}
        >
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </div>
    );
  }

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [keywordArr, setKeywordArr] = useState<string[]>([]);

  const onKeywordClick = useCallback((keyword: string) => {
    setKeywordArr((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword],
    );
  }, []);

  const onRightClick = useCallback((e: React.MouseEvent, node: any) => {
    e.preventDefault();
    console.log("Right clicked node:", node);
  }, []);

  const nodeTypes = useMemo(
    () => ({
      custom: (nodeProps: any) => (
        <CustomNode
          {...nodeProps}
          keywordArr={keywordArr}
          onRightClick={onRightClick}
          onKeywordClick={onKeywordClick}
        />
      ),
    }),
    [keywordArr, onRightClick, onKeywordClick],
  );

  useMemo(() => {
    console.log("데이터 로딩:", data);
    if (data) {
      const fetchedNodes = data.contentData.map((item: any) => ({
        id: `${item.id}`,
        type: "custom",
        data: {
          id: item.id,
          title: item.title,
          date: item.created_at,
          subtitle: item.subtitle || "",
          content: item.content,
          lock: false, // 로그인 로직 제거로 항상 false
          fixed: Boolean(item.fixed),
          slug: item.slug || "",
          keywords: item.keyword || "",
          view: item.view || 0,
        },
        position: { x: item.position_x, y: item.position_y },
      }));

      const fetchedEdge = data.edgeData.map((item: any) => ({
        id: `${item.id}`,
        source: item.source,
        target: item.target,
      }));

      console.log("생성된 노드들:", fetchedNodes);
      console.log("생성된 엣지들:", fetchedEdge);

      setNodes(fetchedNodes);
      setEdges(fetchedEdge);
    }
  }, [data]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
  );

  if (isLoading) return <Loading />;

  return (
    <main style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        elementsSelectable={true}
        nodesDraggable={true}
        nodesConnectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        panOnScroll={true}
        zoomOnDoubleClick={false}
        fitView
        style={{ background: "#f0f0f0" }}
      />

      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <Link
          to="/content/write"
          style={{
            background: "#007bff",
            color: "white",
            padding: "12px",
            borderRadius: "50%",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
          }}
        >
          +
        </Link>
      </div>
    </main>
  );
}
