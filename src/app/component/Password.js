"use client";
import React, { useState } from "react";

export default function PasswordCheckModal({ setIsModalOpen, setIsPasswordCheck, setPassword }) {

    const [modalPassword, setModalPassword] = useState("");

    const modalClose = () => {
        setPassword('');
        setModalPassword("");
        setIsModalOpen(false);
    }

    const passwordCheck = async (e) => {
        e.preventDefault();
        setPassword(modalPassword);
        setIsPasswordCheck(true);
    }

    return (
        <div className="modal_bg">
            <div className="modal password">
                <div className='modal_header'>
                    <h2>Password</h2>
                    <button onClick={() => { modalClose() }}>
                        <i className='icon-cancel'></i>
                    </button>
                </div>

                <div className="modal_form">

                    <div className='modal_input_box'>
                        <input
                            type="password"
                            value={modalPassword}
                            onChange={(e) => {
                                setModalPassword(e.target.value);
                            }}
                        />
                    </div>

                    <button className="btn_all" onClick={passwordCheck}>check!</button>
                </div>
            </div>
        </div>
    )

}