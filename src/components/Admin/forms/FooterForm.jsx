import React from 'react';

export default function FooterForm({ footerConfig, dbActions, onSaveSuccess }) {
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await dbActions.saveFooter({ credits: formData.get('credits'), links: footerConfig.links });
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
             <h3 className="font-bold text-lg mb-4 text-slate-700">Footer Configuration</h3>
             <form onSubmit={handleSubmit}>
                <label className="block mb-2 text-sm font-bold">Credits Text</label>
                <input name="credits" defaultValue={footerConfig.credits} className="w-full border p-2 rounded mb-4"/>
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Footer</button>
             </form>
        </div>
    );
}