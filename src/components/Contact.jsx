import emailjs from "@emailjs/browser";
import { useRef, useState } from "react";
import { useAlert } from "@/hooks";
import { Alert } from "@/components";

const Contact = () => {
	const formRef = useRef();
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const { alert, showAlert, hideAlert } = useAlert();
	const [loading, setLoading] = useState(false);

	const handleChange = ({ target: { name, value } }) =>
		setForm((prev) => ({ ...prev, [name]: value }));

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!form.name || !form.email) {
			showAlert({ show: true, text: "Name and email are required.", type: "danger" });
			return;
		}

		setLoading(true);
		emailjs
			.send(
				import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
				import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
				{
					from_name: form.name,
					to_name: "Andy Valencia",
					from_email: form.email,
					to_email: "andyvalencia.cs@gmail.com",
					message: form.message,
				},
				import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY,
			)
			.then(
				() => {
					setLoading(false);
					showAlert({ show: true, text: "Message sent — thanks for reaching out.", type: "success" });
					setTimeout(() => {
						hideAlert();
						setForm({ name: "", email: "", message: "" });
					}, 3000);
				},
				(error) => {
					setLoading(false);
					console.error(error);
					showAlert({ show: true, text: "Failed to send. Please try again.", type: "danger" });
				},
			);
	};

	const inputClass =
		"w-full bg-neutral-900 border border-neutral-700/60 rounded-sm px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors font-mono";

	return (
		<div className='w-full bg-neutral-800 py-20 px-6 md:px-10 lg:px-20'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<div className='mb-10 text-center'>
					<p className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn mb-3'>
						Get in Touch
					</p>
					<h2 className='text-3xl md:text-4xl font-bold text-white'>Contact</h2>
					<p className='mt-3 text-sm text-fontz'>
						Have a question, feedback, or idea? Send a message and I&apos;ll get back to you.
					</p>
				</div>

				{/* Form */}
				<div
					ref={formRef}
					className='border border-neutral-700/50 rounded-sm bg-neutral-900 p-6 md:p-8'>
					{alert.show && <Alert {...alert} />}

					<form onSubmit={handleSubmit} className='flex flex-col gap-5'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
							{/* Name */}
							<div className='flex flex-col gap-1.5'>
								<label className='font-mono text-[9px] tracking-widest uppercase text-neutral-400'>
									Name <span className='text-red-500'>*</span>
								</label>
								<input
									type='text'
									name='name'
									className={inputClass}
									placeholder='Call sign or real name'
									value={form.name}
									onChange={handleChange}
								/>
							</div>

							{/* Email */}
							<div className='flex flex-col gap-1.5'>
								<label className='font-mono text-[9px] tracking-widest uppercase text-neutral-400'>
									Email <span className='text-red-500'>*</span>
								</label>
								<input
									type='email'
									name='email'
									className={inputClass}
									placeholder='your@email.com'
									value={form.email}
									onChange={handleChange}
								/>
							</div>
						</div>

						{/* Message */}
						<div className='flex flex-col gap-1.5'>
							<label className='font-mono text-[9px] tracking-widest uppercase text-neutral-400'>
								Message
							</label>
							<textarea
								name='message'
								rows='5'
								className={`${inputClass} resize-none`}
								placeholder='Write your message here...'
								value={form.message}
								onChange={handleChange}
							/>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='btn self-start font-mono text-[10px] tracking-widest uppercase px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'>
							{loading ? "Sending..." : "Send Message"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Contact;
