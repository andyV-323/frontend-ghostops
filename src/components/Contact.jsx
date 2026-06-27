import { useRef, useState } from "react";
import { useAlert } from "@/hooks";
import { Alert } from "@/components";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
	const formRef = useRef();
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const { alert, showAlert, hideAlert } = useAlert();
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleChange = ({ target: { name, value } }) =>
		setForm((prev) => ({ ...prev, [name]: value }));

	const handleSubmit = async (e) => {
		e.preventDefault();

		const name = form.name.trim();
		const email = form.email.trim();
		const message = form.message.trim();

		if (!name || !email || !message) {
			showAlert({ show: true, text: "All fields are required.", type: "danger" });
			return;
		}
		if (!EMAIL_RE.test(email)) {
			showAlert({ show: true, text: "Please enter a valid email address.", type: "danger" });
			return;
		}
		if (message.length > 4000) {
			showAlert({ show: true, text: "Message must be under 4000 characters.", type: "danger" });
			return;
		}

		setLoading(true);
		hideAlert();

		try {
			const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, message }),
			});

			const data = await res.json();

			if (!res.ok) {
				showAlert({ show: true, text: data.error || "Failed to send. Please try again.", type: "danger" });
				return;
			}

			setSent(true);
			showAlert({ show: true, text: "Message sent — thanks for reaching out!", type: "success" });
			setForm({ name: "", email: "", message: "" });
			setTimeout(() => { hideAlert(); setSent(false); }, 5000);
		} catch {
			showAlert({ show: true, text: "Network error. Please check your connection and try again.", type: "danger" });
		} finally {
			setLoading(false);
		}
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

					<form onSubmit={handleSubmit} className='flex flex-col gap-5' noValidate>
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
									maxLength={100}
									disabled={loading}
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
									disabled={loading}
								/>
							</div>
						</div>

						{/* Message */}
						<div className='flex flex-col gap-1.5'>
							<label className='font-mono text-[9px] tracking-widest uppercase text-neutral-400'>
								Message <span className='text-red-500'>*</span>
							</label>
							<textarea
								name='message'
								rows='5'
								className={`${inputClass} resize-none`}
								placeholder='Write your message here...'
								value={form.message}
								onChange={handleChange}
								maxLength={4000}
								disabled={loading}
							/>
							<span className='font-mono text-[8px] text-neutral-600 text-right'>
								{form.message.length}/4000
							</span>
						</div>

						<button
							type='submit'
							disabled={loading || sent}
							className='btn self-start font-mono text-[10px] tracking-widest uppercase px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity'>
							{loading ? "Sending..." : sent ? "Sent" : "Send Message"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Contact;
