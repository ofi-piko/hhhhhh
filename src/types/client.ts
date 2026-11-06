export type Client = {
	id: string;
	phone: string;
	city: string;
	address: string;
	theme: 'light' | 'dark';
	language: 'uz' | 'ru' | 'en';
	created_at: string;
	updated_at: string;
	status: string | null;
};
