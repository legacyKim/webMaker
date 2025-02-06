import React, { useState, useEffect } from "react";

interface ContentPasswordProps {
    passEnv: string;
    slug: string;
}

export default function ContentPassword({ passEnv, slug }: ContentPasswordProps) {

    const [contentPass, setContentPass] = useState<string>();

    useEffect(() => {
        if (contentPass === passEnv) {
            console.log(slug);
        }
    }, [contentPass]);

    return (
        <div className="content_pass">
            <div className="content_pass_bg">
                <input type="password" onChange={(e) => {
                    setContentPass(e.target.value);
                }} />
            </div>
        </div>
    )
}