import React, { useState, useMemo, useCallback, useRef } from "react";
import ReactFlow, {
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  ReactFlowProvider,
} from "react-flow-renderer";
import { useQuery } from "react-query";
import { fetchContent } from "../api/contentApi";
import CustomNode from "../components/CustomNode";
import Loading from "../components/shared/Loading";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";

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

  // 노드 위치 저장 API 호출 (디바운싱됨)
  const saveNodePositionsFn = useRef(
    debounce(async (nodesToSave: Node[]) => {
      try {
        const updates: { [key: string]: { position_x: number; position_y: number } } = {};
        
        console.log("🔍 저장할 노드들 분석:");
        nodesToSave.forEach((node) => {
          console.log(`  - ID: "${node.id}" (type: ${typeof node.id}), pos: (${node.position.x}, ${node.position.y})`);
          updates[node.id] = {
            position_x: Math.round(node.position.x),
            position_y: Math.round(node.position.y),
          };
        });

        console.log("💾 노드 위치 저장 시도:", updates);

        const response = await fetch("/api/content/batch/positions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          console.error("❌ 노드 위치 저장 실패:", responseData);
        } else {
          console.log("✅ 노드 위치 저장됨:", responseData);
        }
      } catch (err) {
        console.error("❌ 노드 위치 저장 중 오류:", err);
      }
    }, 1000)
  );

  // 엣지 저장 API 호출 (디바운싱됨)
  const saveEdgesFn = useRef(
    debounce(async (edgesToSave: Edge[]) => {
      try {
        console.log("💾 엣지 저장 시도:", edgesToSave);

        const response = await fetch("/api/edges", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ edges: edgesToSave }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error("엣지 저장 실패:", responseData);
        } else {
          console.log("✅ 엣지 저장됨:", responseData);
        }
      } catch (err) {
        console.error("엣지 저장 중 오류:", err);
      }
    }, 1000)
  );

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
      // API에서 이미 올바른 형식으로 반환되므로, position만 수정
      const fetchedNodes = data.contentData.map((item: any) => {
        // position 형식 통일
        let position;
        if (item.position) {
          position = { x: item.position.x, y: item.position.y };
        } else {
          position = { x: item.position_x || 100, y: item.position_y || 100 };
        }

        return {
          ...item,
          position,
        };
      });

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
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        // 노드 변경이 있을 때마다 위치 저장
        saveNodePositionsFn.current(updatedNodes);
        return updatedNodes;
      });
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        // 엣지 변경이 있을 때마다 저장
        saveEdgesFn.current(updatedEdges);
        return updatedEdges;
      });
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const updatedEdges = addEdge(connection, eds);
        saveEdgesFn.current(updatedEdges);
        return updatedEdges;
      });
    },
    []
  );

  if (isLoading) return <Loading />;

  return (
    <ReactFlowProvider>
      <main className="dark" style={{ height: "94vh", width: "100%" }}>
        <ReactFlow
          className="dark"
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
          panOnScroll={false}
          zoomOnDoubleClick={false}
          minZoom={0.1}
          maxZoom={4}
          fitView
        />

        {/* 새 컨텐츠 추가 버튼 */}
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
          >
            <i className="icon-pencil-alt"></i>
          </Link>
        </div>
      </main>
    </ReactFlowProvider>
  );
}
