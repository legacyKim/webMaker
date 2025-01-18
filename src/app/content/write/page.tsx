"use client";

import React, { useState } from "react";
import { ChangeEvent, FormEvent } from "react";

export default function Write() {

    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        content: "",
    });

    const currentDate = new Date().toISOString().split('T')[0];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const dataToSend = {
            ...formData,
            date: currentDate,
            position : { x: Math.random() * 400, y: Math.random() * 400 },
        };

        try {
            const response = await fetch('/content/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                console.log("Project created successfully!");
            } else {
                console.error("Failed to create project");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <form onSubmit={(e) => { handleSubmit(e) }} className="write">
            <div>
                <input className="write_title" type="text" name="title" value={formData.title} placeholder="title" onChange={handleChange} />
            </div>
            <div>
                <input className="write_subtitle" type="text" name="subtitle" value={formData.subtitle} placeholder="subtitle" onChange={handleChange} />
            </div>
            <div>
                <textarea className="write_content" name="content" value={formData.content} onChange={handleChange} placeholder="content" />
            </div>
            <button className="customBtn" type="submit">Submit</button>
        </form>
    );
};