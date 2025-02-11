"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Modal({ setIsModalOpen }) {

    const [projectName, setProjectName] = useState('');
    const [company, setCompany] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const [password, setPassowrd] = useState('');

    const projectImgChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
    };

    const projectSubmit = async (e) => {
        e.preventDefault();

        if (projectName === '') {
            alert("프로젝트명을 입력해 주세요.");
            return
        }

        if (company === '') {
            alert("회사명을 입력해 주세요.");
            return
        }

        if (link === '') {
            alert("주소를 입력해 주세요.");
            return
        }

        if (image === '') {
            alert("이미지를 추가해 주세요.");
            return
        }

        if (password === '') {
            alert("비밀번호를 입력해 주세요.");
            return;
        }

        const formData = new FormData();
        formData.append('projectName', projectName);
        formData.append('company', company);
        formData.append('link', link);
        formData.append('image', image);
        formData.append('password', password);

        try {
            const response = await axios.post('/project/api', formData);

            setProjectName('');
            setCompany('');
            setLink('');
            setImage(null);
            setPassowrd('');

            return response.data;

        } catch (error) {
            console.error(error);
        }
    };

    const [modalAnima, setModalAnima] = useState("");

    const modalClose = () => {
        setProjectName('');
        setCompany('');
        setLink('');
        setImage(null);
        setPassowrd('');
        setModalAnima("close");

        setTimeout(() => {
            setModalAnima("");
            setIsModalOpen(false);
        }, 1000);
    }

    return (
        <div className={`modal_bg ${modalAnima}`}>
            <div className={`modal ${modalAnima}`}>
                <div className='modal_header'>
                    <h2>New Project</h2>
                    <button onClick={() => { modalClose() }}>
                        <i className='icon-cancel'></i>
                    </button>
                </div>

                <form className="modal_form" onSubmit={projectSubmit}>
                    <div className='modal_input_box'>
                        <span>
                            Project name
                        </span>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>
                    <div className='modal_input_box'>
                        <span>
                            company
                        </span>
                        <input
                            type="text"
                            placeholder=""
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />
                    </div>
                    <div className='modal_input_box'>
                        <span>
                            Link
                        </span>
                        <input
                            type="text"
                            placeholder="https://"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>
                    <div className='modal_input_box'>
                        <span>
                            Project img
                        </span>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={projectImgChange}
                        />

                        <div className="file_custom">
                            <label htmlFor="file-upload">
                                <div className={`file_name ${image ? 'active' : ''}`}>
                                    {image && (
                                        <b>
                                            {image.name}
                                        </b>
                                    )}
                                </div>
                                <div className="file_upload_btn">
                                    <i className='icon-upload-2'></i>
                                </div>
                            </label>
                            {image && (
                                <button onClick={() => { setImage('') }}>
                                    <i className='icon-cancel'></i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className='modal_input_box'>
                        <span>
                            Password
                        </span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>
                    <button className='btn_all' type="submit">New Project</button>
                </form>
            </div>
        </div>
    );
}