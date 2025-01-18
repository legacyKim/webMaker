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
} from "react-flow-renderer";

import { useQuery } from "react-query";
import { fetchContent } from './api/api.js';
import CustomNode from "./CustomNode.tsx";
import Loading from "../component/Loading.js";
import Link from 'next/link';
import axios from 'axios';

const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
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
            const fetchedNodes = data.contentData.map((item: { id: string; data: { title: string, date: string, subtitle: string, content: string }; position: { x: number, y: number } }) => ({
                id: `${item.id}`,
                type: "custom",
                data: {
                    id: item.id,
                    title: item.data.title,
                    date: item.data.date,
                    subTitle: item.data.subtitle,
                    content: item.data.content,
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

    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
    }), []);

    const debounceNodes = useRef(
        debounce(async (updatedNodes: { id: string, position: { x: number, y: number } }[]) => {
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
        setNodes((nds) => applyNodeChanges(changes, nds));

        const updatedNodes = changes.map((change) => {
            if (change.type === 'position' && change.dragging === true) {
                return {
                    id: change.id,
                    position: change.position,
                };
            }
            return null;
        }).filter((node): node is { id: string, position: { x: number, y: number } } => node !== null);

        if (updatedNodes.length > 0) {
            debounceNodes(updatedNodes);
        }
    }, []);

    const debounceEdegs = useRef(
        debounce(async (updatedEdges: { id: string, source: string, target: string }[]) => {
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
            .filter((edge): edge is { id: string, source: string, target: string } => edge !== null);

        if (updatedEdges.length > 0) {
            debounceEdegs(updatedEdges);
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
                params: { id: edgeId },
            });
        } catch (error) {
            console.error('Failed to delete edge:', error);
        }
    }, []);

    if (isLoading) return <Loading />;

    return (
        <div className="page">
            <div className='page_header'>
                <div className='page_header_tit'>
                    <h4>Content</h4>
                </div>
                <Link
                    className="customBtn"
                    href={{ pathname: "/content/write" }}>
                    <span>New Content</span>
                </Link>
            </div>

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
        </div>
    );
}
