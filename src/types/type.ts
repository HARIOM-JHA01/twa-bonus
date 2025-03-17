export interface Reward {
    id: number;
    poster_id: number;
    reward_name: string;
    reward_image: string;
    country: string;
    start_date: string | null;
    end_date: string | null;
    reward_detail: string;
    status: string;
    reward_status: number;
    verifiaction_link_0: string | null;
    repeat: string;
    max_user: number;
    join_user: number;
    draw_detail_link: string | null;
    created_at: string;
    updated_at: string;
}

export interface Draw {
    id: number;
    poster_id: number;
    draw_name: string;
    draw_image: string;
    country: string;
    start_date: string;
    end_date: string;
    draw_detail: string;
    status: string;
    draw_status: number;
    channel_link: string | null;
    verifiaction_link_0: string | null;
    verifiaction_link_1: string | null;
    verifiaction_link_2: string | null;
    verifiaction_link_3: string | null;
    verifiaction_link_4: string | null;
    repeat: string;
    max_user: number;
    join_user: number;
    prize_detail_link: string | null;
    draw_detail_link: string;
    created_at: string;
    updated_at: string;
}

export type PrizeItem = {
    id: number;
    draw_id: number;
    reward_id: number;
    no_win_prize: string;
    no_of_prize: string;
    prize: string;
    e_no_win_prize: string;
    e_no_of_prize: string;
    e_prize: string;
    status: number;
    created_at: string;
    updated_at: string;
    echeck: number;
    pcheck: number;
};

export type IndividualDraw = {
    id: number;
    poster_name: string;
    draw_name: string;
    draw_image: string;
    country: string;
    start_date: string;
    end_date: string;
    draw_detail: string;
    status: string;
    join_user: number;
    draw_status: number;
    winner_declare_date: string;
    channel_link: string | null;
    prize_detail_link: string | null;
    draw_detail_link: string | null;
    verifiaction_link_0: string | null;
    verifiaction_link_1: string | null;
    verifiaction_link_2: string | null;
    verifiaction_link_3: string | null;
    verifiaction_link_4: string | null;
    created_at: string;
    Prize_list: PrizeItem[];
    current_time: string;
};
