"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import ReactFlow, { NodeChange, EdgeChange, Connection, applyNodeChanges, applyEdgeChanges, addEdge, Node, Edge, NodeProps } from "react-flow-renderer";
import { useQuery } from "react-query";
import { fetchContent } from './api/api.js';
import CustomNode from "./CustomNode.tsx";
import Loading from "../component/Loading.js";
import Link from 'next/link';
import axios from 'axios';

type NodePosition = {
    id: string;
    position: { x: number; y: number };
    lock: number;
    fixed: number;
};

type NodeStatus = {
    id: string;
    lock: boolean;
    fixed: boolean;
}

type EdgeData = {
    id: string;
    source: string | null;
    target: string | null;
};

const debounceNodesFunc = (func: (updatedNodes: NodePosition[]) => Promise<void>, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (updatedNodes: NodePosition[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(updatedNodes).catch(console.error);
        }, delay);
    };
};

const debounceEdgesFunc = (func: (updatedEdges: EdgeData[]) => Promise<void>, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (updatedEdges: EdgeData[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(updatedEdges).catch(console.error);
        }, delay);
    };
};

export default function ContentMap() {

    const { data, isLoading } = useQuery("contentData", fetchContent, {
        refetchInterval: 120000,
    });

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    useMemo(() => {
        if (data) {
            const fetchedNodes = data.contentData.map((item: { id: string; data: { title: string, date: string, subtitle: string, content: string }; lock: boolean; fixed: boolean; position: { x: number, y: number }, slug: string; }) => ({
                id: `${item.id}`,
                type: "custom",
                data: {
                    id: item.id,
                    title: item.data.title,
                    date: item.data.date,
                    subtitle: item.data.subtitle,
                    content: item.data.content,
                    lock: item.lock,
                    fixed: item.fixed,
                    slug: item.slug,
                },
                position: item.position,
            }));

            const fetchedEdge = data.edgeData.map((item: { id: string; source: string; target: string }) => ({
                id: `${item.id}`,
                source: item.source,
                target: item.target,
            }));

            setNodes(fetchedNodes);
            setEdges(fetchedEdge);
        }
    }, [data]);

    const [optionPos, setOptionPos] = useState<{ x: number; y: number } | null>(null);

    const handleRightClick = (e: React.MouseEvent, node: NodeProps['data']) => {
        const { clientX, clientY } = e;
        setOptionPos({ x: clientX, y: clientY });
        setSelectedNode(node);
    };

    const nodeTypes = useMemo(() => ({
        custom: (props: NodeProps) => <CustomNode {...props} onRightClick={handleRightClick} />,
    }), []);

    const handleFixed = async (updatedNodes: NodeStatus[]) => {
        try {
            for (const node of updatedNodes) {
                const updatedFixed = !node.fixed;
                await axios.put(`/content/api`, {
                    id: node.id,
                    fixed: updatedFixed,
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update fixed', error);
        }
    }

    const handlelock = async (updatedNodes: NodeStatus[]) => {
        try {
            for (const node of updatedNodes) {
                const updatedlock = !node.lock;
                await axios.put(`/content/api`, {
                    id: node.id,
                    lock: updatedlock,
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update lock:', error);
        }
    }

    const [selectedNode, setSelectedNode] = useState<NodeStatus | null>(null);

    const debounceNodes = useRef(
        debounceNodesFunc(async (updatedNodes: NodePosition[]) => {
            try {
                for (const node of updatedNodes) {
                    await axios.put(`/content/api`, {
                        id: node.id,
                        position: node.position,
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to update node position:', error);
            }
        }, 300)
    ).current;

    const onNodesChange = useCallback(async (changes: NodeChange[]) => {
        setNodes((nds) =>
            applyNodeChanges(
                changes.filter((change) => {
                    if (change.type === "position") {
                        const node = nds.find((n) => n.id === change.id);
                        return !(node?.data?.fixed);
                    }
                }),
                nds
            )
        );

        const updatedNodes = changes.map((change) => {
            if (change.type === 'position' && change.dragging === true) {
                return {
                    id: change.id,
                    position: change.position,
                };
            }
            return null;
        }).filter((node): node is NodePosition => node !== null);

        if (updatedNodes.length > 0) {
            debounceNodes(updatedNodes);
        }
    }, []);

    const debounceEdges = useRef(
        debounceEdgesFunc(async (updatedEdges: EdgeData[]) => {
            try {
                for (const edge of updatedEdges) {
                    await axios.put(`/edge/api`, {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to update edge position:', error);
            }
        }, 300)
    ).current;

    const onEdgesChange = useCallback(async (changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));

        const updatedEdges = changes
            .map((change) => {
                if (change.type === 'add' || change.type === 'remove') {
                    if ('source' in change && 'target' in change) {
                        const edgeId = `${change.source}-${change.target}`;
                        return {
                            id: edgeId,
                            source: change.source,
                            target: change.target,
                        };
                    }
                }
                return null;
            })
            .filter((edge): edge is EdgeData => edge !== null);

        if (updatedEdges.length > 0) {
            debounceEdges(updatedEdges);
        }
    }, []);

    const onConnect = useCallback(async (connection: Connection) => {
        const newEdge = {
            ...connection,
            id: `${connection.source}-${connection.target}`,
        };
        setEdges((eds) => addEdge(newEdge, eds));

        try {
            await axios.post('/content/api', {
                source: connection.source,
                target: connection.target,
            });
        } catch (error) {
            console.error('Failed to add edge:', error);
        }
    }, []);

    const deleteEdge = useCallback(async (edgeId: string) => {
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        try {
            await axios.delete(`/content/api`, {
                data: { id: edgeId, type: "edge" },
            });
        } catch (error) {
            console.error('Failed to delete edge:', error);
        }
    }, []);

    if (isLoading) return <Loading />;

    return (
        <div className="container dark" onClick={() => { setOptionPos(null) }}>
            <div className="content">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeClick={(_, edge) => deleteEdge(edge.id)}
                    nodeTypes={nodeTypes}
                    elementsSelectable={true}
                    zoomOnScroll={true}
                />
            </div>

            {optionPos && selectedNode && (
                <ContentOption position={optionPos} selectedNode={selectedNode} />
            )}

            <div className="btn_wrap">
                <Link
                    className="customBtn"
                    href={{ pathname: "/content/write" }} >
                    <i className="icon-vector-pencil"></i>
                </Link>
            </div>
        </div>
    );

    function ContentOption({ position, selectedNode }: { position: { x: number; y: number }; selectedNode: NodeStatus }) {

        return (
            <div className="content_option" style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}>
                <button onClick={() => { handlelock([selectedNode]) }}><i className={`icon-lock ${Boolean(selectedNode.lock) !== false ? 'active' : ''}`}></i></button>
                <button onClick={() => { handleFixed([selectedNode]) }}><i className={`icon-pinboard ${Boolean(selectedNode.fixed) !== false ? 'active' : ''}`}></i></button>
            </div>
        )
    }
}

