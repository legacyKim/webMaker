"use client";

import { useState, useEffect } from 'react';
import { fetchProjects } from './api/api.js';

import Image from 'next/image';

interface Project {
    imgsrc: string;
    project: string;
    company: string;
    link: string;
    
}

import Modal from './components/Modal.js';
import { useQuery } from "react-query";

import Loading from "../component/Loading.js"

export default function Project() {

    const [projectList, setProjectList] = useState<Project[]>([]);

    const { data, isLoading } = useQuery("projectData", fetchProjects, {
        refetchInterval: 120000,
    });

    useEffect(() => {
        if (data) {
            setProjectList(data.projects);
        }
    }, [data]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) return <Loading />;

    return (
        <div className='container dark'>
            <ul className='project_list'>
                {
                    projectList.map((p, i) => (
                        <li key={i}>
                            <a href={p.link} target="_blank">
                                <div className='project_img'>
                                    <Image
                                        src={p.imgsrc}
                                        alt={p.project}
                                        width={500}
                                        height={300}
                                    />
                                    <svg stroke="#fff" fill="#fff" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path>
                                    </svg>
                                </div>
                                <div className='flex-fs project_txt'>
                                    <span>Project</span>
                                    <p>{p.project}</p>
                                </div>
                                <div className='flex-fs project_txt'>
                                    <span>Company</span>
                                    <p>{p.company}</p>
                                </div>
                            </a>
                        </li>
                    ))
                }
            </ul>

            <div className='btn_wrap'>
                <button className='customBtn' onClick={() => { setIsModalOpen(false); }}>
                    <i className='icon-vector-pencil'></i>
                </button>
            </div>

            {isModalOpen && <Modal setIsModalOpen={setIsModalOpen} />}

        </div>

    )
}