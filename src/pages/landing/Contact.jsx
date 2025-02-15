/** @format */

import emailjs from "@emailjs/browser";
import { useRef, useState } from "react";
import { Button, Card, Input } from "@material-tailwind/react";
import useAlert from "../../hooks/useAlert";
import Alert from "../../components/Alert";

const Contact = () => {
	const formRef = useRef();
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const { alert, showAlert, hideAlert } = useAlert();
	const [loading, setLoading] = useState(false);

	const handleChange = ({ target: { name, value } }) => {
		setForm({ ...form, [name]: value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!form.name || !form.email) {
			showAlert({
				show: true,
				text: "Please fill in all required fields.",
				type: "danger",
			});
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
				import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
			)
			.then(
				() => {
					setLoading(false);
					showAlert({
						show: true,
						text: "Thank you for your message 😃",
						type: "success",
					});

					setTimeout(() => {
						hideAlert();
						setForm({ name: "", email: "", message: "" });
					}, 3000);
				},
				(error) => {
					setLoading(false);
					console.error(error);
					showAlert({
						show: true,
						text: "I didn't receive your message 😢",
						type: "danger",
					});
				}
			);
	};

	return (
		<div className='flex flex-col items-center w-full bg-neutral-800 min-h-screen'>
			{/* Responsive Layout */}
			<div className='flex flex-col lg:flex-row w-full h-auto lg:h-screen  bg-cover bg-center p-6 md:p-12 lg:p-20'>
				{/* Left Section (Text) */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10'>
					<div className='flex flex-col items-center text-center lg:text-left max-w-lg'>
						<h1 className='text-3xl md:text-5xl font-bold text-white mb-4'>
							Contact Us
						</h1>
						<p className='text-md md:text-lg text-gray-300'>
							Have a question or feedback? Reach out to us, and we’ll get back
							to you as soon as possible.
						</p>
					</div>
				</div>

				{/* Right Section (Form) */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10'>
					<Card
						ref={formRef}
						className='w-full max-w-md md:max-w-xl bg-black p-6 md:p-10 rounded-2xl shadow-lg'>
						{alert.show && <Alert {...alert} />}
						<h2 className='text-2xl md:text-3xl font-bold text-white text-center mb-6'>
							Get in Touch
						</h2>

						<form
							onSubmit={handleSubmit}
							className='flex flex-col gap-6'>
							{/* Name Input */}
							<div className='flex flex-col'>
								<label className='text-white font-semibold mb-2'>
									Name <span className='text-red-500'>*</span>
								</label>
								<Input
									type='text'
									name='name'
									className='w-full rounded-md border border-gray-500 bg-white py-3 px-6 text-base font-medium text-gray-700 focus:border-blue-500 focus:shadow-md'
									placeholder='John Doe'
									value={form.name}
									onChange={handleChange}
								/>
							</div>

							{/* Email Input */}
							<div className='flex flex-col'>
								<label className='text-white font-semibold mb-2'>
									Email <span className='text-red-500'>*</span>
								</label>
								<Input
									type='email'
									name='email'
									className='w-full rounded-md border border-gray-500 bg-white py-3 px-6 text-base font-medium text-gray-700 focus:border-blue-500 focus:shadow-md'
									placeholder='john@example.com'
									value={form.email}
									onChange={handleChange}
								/>
							</div>

							{/* Message Input */}
							<div className='flex flex-col'>
								<label className='text-white font-semibold mb-2'>
									Your Message
								</label>
								<textarea
									name='message'
									rows='4'
									className='w-full resize-none rounded-md border border-gray-500 bg-white py-3 px-6 text-base font-medium text-gray-700 focus:border-blue-500 focus:shadow-md'
									placeholder='Write your thoughts here...'
									value={form.message}
									onChange={handleChange}
								/>
							</div>

							{/* Submit Button */}
							<Button
								type='submit'
								disabled={loading}
								className='btn'>
								{loading ? "Sending..." : "Submit"}
							</Button>
						</form>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default Contact;
