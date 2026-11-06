export type Product = {
    id: number;
    name: string;
    category: string;
    short_desc: string | null;
    volume_ml: number;
    price: number;
    calories: number | null;
    protein_g: number | null;
    fat_g: number | null;
    carbs_g: number | null;
    is_vegan: boolean;
    is_spicy: boolean;
    is_available: boolean;
    stock_qty: number;
    image_url: string | null;
    created_at: string;
    updated_at: string;
};