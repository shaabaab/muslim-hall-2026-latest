<?php


use App\Models\Country;
use App\Models\ExamSubject;
use App\Models\AssignAllSubject;
use App\Models\SiteSetting;
use App\Models\User;

use Carbon\Carbon;

//auth user
if (!function_exists('authUser')) {
    function authUser()
    {
        return \App\Models\User::find(auth()->id());
    }
}


//total registered users
if (!function_exists('totalRegisteredUsers')) {
    function totalRegisteredUsers()
    {
        return \App\Models\User::whereNotNull('email_verified_at')->count();
    }
}

//total users
if (!function_exists('totalUsers')) {
    function totalUsers()
    {
        return \App\Models\User::count();
    }
} 


//all users
if (!function_exists('allUsers')) {
    function allUsers()
    {
        return \App\Models\User::where('user_role', '!=', 1)->get();
    }
}


//total reporters
if (!function_exists('totalReporters')) {
    function totalReporters()
    {
        return \App\Models\User::where('user_role', 3)->count();
    }
}


//total news
if (!function_exists('totalNews')) {
    function totalNews()
    {
        return \App\Models\News::where('news_status', 1)->count();
    }
}


//total news viewers
if (!function_exists('totalNewsViewers')) {
    function totalNewsViewers()
    {
        return \App\Models\News::where('news_status', 1)->sum('news_view_count');
    }
}





if (!function_exists('find_country')) {
    function find_country($id)
    {
       $data =  Country::find($id);
        return $data->name;
    }
}


if (!function_exists('getUserTypeName')) {
    function getUserTypeName()
    {
        if (auth()->user()->user_type == 1) {
            return 'Admin';
        } elseif (auth()->user()->user_type == 2) {
            return 'Admin';
        } else {
            return "USER";
        }
    }

}


if (!function_exists('limit_words')) {
    function limit_words($string, $word_limit = 20)
    {
        $string = strip_tags($string);
        $words = explode(' ', strip_tags($string));
        $return = trim(implode(' ', array_slice($words, 0, $word_limit)));
        if (strlen($return) < strlen($string)) {
            $return .= '...';
        }
        return $return;
    }
}



if (!function_exists('human_words')) {

    function human_words($string)
    {
        $string = ucwords(str_replace('_', ' ', $string));

        return $string;
    }
}

if (!function_exists('get_site_logo')) {
    function get_site_logo()
    {
        $logo = asset('logo.png');
        $query = SiteSetting::first();
        if ($query) {
            if ($query->site_logo) {
                $logo = asset('/uploads/site_setting/original/'.@$query->site_logo);
            }
        }

        return $logo;
    }
}
if (!function_exists('get_site_name')) {
    function get_site_name()
    {
        $name = "Bangladesh Naval Academy";
        $query = SiteSetting::first();
        if ($query) {
            if ($query->site_name) {
                $name = $query->site_name;
            }
        }
        return $name;
    }
}
if (!function_exists('get_site_motto')) {
    function get_site_motto()
    {

        $name = "Fight in the way of Allah";
        $query = SiteSetting::first();
        if ($query) {
            if ($query->motto) {
                $name = $query->motto;
            }
        }
        return $name;
    }
}

if (!function_exists('get_mobile_logo')) {
    function get_mobile_logo()
    {
        $logo = asset('assets/images/brand/favicon.png');
        $query = SiteSetting::first();
        if ($query) {
            if ($query->mobile_site_logo) {
                $logo = Config::get('app.asset_url') . '/' . $query->mobile_site_logo;
            }
        }

        return $logo;
    }
}


if (!function_exists('dayslot')) {
    function dayslot($week = true)
    {
        $days = [
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        ];
        if ($week) {
            $days = ['Full Week', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        }

        return $days;
    }
}

if (!function_exists('exam')) {
    function exam($index = '')
    {
        $exams = [
            1 => 'Mid Exam',
            2 => 'Final Exam',
        ];

        if ($index != '') {
            $exams = $exams[$index];
        }
        return $exams;
    }
}
if (!function_exists('wings')) {
    function wings($index = '')
    {
        $wings = [
            1 => 'MIST',
            2 => 'ADMIN',
            3 => 'ACADEMIC',
            4 => 'TRAINING',
        ];

        if ($index != '') {
            $wings = $wings[$index];
        }
        return $wings;
    }
}

if (!function_exists('ordinal_number')) {
    function ordinal_number($number = '')
    {
        $formatter = new NumberFormatter('en-US', NumberFormatter::ORDINAL);
        return @$formatter?->format($number) ?? null;
    }
}


if (!function_exists('weightage_subject')) {
    function weightage_subject($index = '')
    {
        $subject = [

            1 => 'Academics Subjects',
            2 => 'C & L',
            3 => 'Physical Trg',
            4 => 'Parade Trg',
        ];

        if ($index != '') {
            $subject = $subject[$index];
        }
        return $subject;
    }
}


if (!function_exists('module_description')) {
    function module_description($index = '')
    {
        $subject = [

            1 => 'C & L Marks',
            2 => 'PLX Marks',
            3 => 'BMA Results',
            4 => 'Is Results',
            5 => 'Sea Training',
        ];

        if ($index != '') {
            $subject = $subject[$index];
        }
        return $subject;
    }
}


if (!function_exists('get_month')) {
    function get_month($index = '')
    {
        $month = [

            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December',
        ];

        if ($index != '') {
            $month = $month[$index];
        }
        return $month;
    }
}



// if (!function_exists('valid_mobile')) {
//     function valid_mobile($value)
//     {
//         valid_number = value.match("(?:\\+88|88)?(01[3-9]\\d{8})");

//         if(valid_number){
//             return $valid_number[1]; /*valid number method return 3 with actual input*/
//         }else {
//             return false; /*return false when not valid*/
//         }
//     }
// }
if (!function_exists('generate_slug')) {
    /**
     * Return human readable string from camel case or snake case string.
     *
     * @param $string
     * @return string
     */
    function generate_slug($string)
    {
        //        $string = snake_case($string);
        $word = strtolower($string);
        $string = ucwords(str_replace(' ', '_', $word));

        return $string;
    }
}

if (!function_exists('dates_format')) {
    function dates_format($value)
    {
        $result = [
            0 => Carbon::parse($value)->format('d M, Y'),
            1 => Carbon::parse($value)->format('M d, Y'),
            2 => Carbon::parse($value)->format('F j, Y'),
            3 => Carbon::parse($value)->format('d-m-Y'),
            4 => Carbon::parse($value)->format('Y, M d'),
            5 => Carbon::parse($value)->format('Y, M d (l)'),
            6 => Carbon::parse($value)->format('Y, M d (D)'),
            7 => Carbon::parse($value)->format('d M, y'),
            8 => Carbon::parse($value)->format('l d M'),
        ];
        return $result;
    }
}

if (!function_exists('time_formated')) {
    function time_formated($value)
    {
        return date('h:i A', strtotime($value));
    }
}

if (!function_exists('time_formated_to_24')) {
    function time_formated_to_24($value)
    {
        return date('g:i:s', strtotime($value));
    }
}

if (!function_exists('blood_group')) {

    function blood_group()
    {
        $array = ['A+', 'A-', "B+", "B-", "O+", "O-", "AB+", "AB-"];

        return $array;
    }

}


if (!function_exists('get_religion')) {

    function get_religion($index = '')
    {
        $array = [
            "Islam",
            "Hinduism",
            "Buddhism",
            "Christianity",
            "Atheist",
            "Agnostic",
            "Judaism",
            "Bahai",
            "Cao Dai",
            "Jainism",
            "Juche",
            "Neo-Paganism",
            "Nonreligious",
            "Rastafarianism",
            "Secular",
            "Shinto",
            "Sikhism",
            "Spiritism",
            "Tenrikyo",
            "Unitarian-Universalism",
            "Zoroastrianism",
            "primal-indigenous",
            "Chinese traditional religion",
            "African Traditional & Diasporic",
            "Other"
        ];
        if ($index != '') {
            $array = $array[$index];
        }

        return $array;
    }

}

if (!function_exists('create_date_format')) {
    function create_date_format($value)
    {
        $string = Carbon::parse($value);

        return $string->format('d/m/Y');
    }
}


if (!function_exists('db_date_format')) {

    function db_date_format($value)
    {
        $string = $value ? Carbon::createFromFormat('d/m/Y', $value)->format('Y-m-d') : null;

        return $string;

    }
}

if (!function_exists('pendin_office')) {

    function pendin_office()
    {
        $data = User::where('user_type',3)->where('approve_status',1)->get()->count();

        return $data ;



    }


}

if (!function_exists('check_exam_subject')) {

    function check_exam_subject($id,$exam_id, $sub_id,$sub_group_id="")
    {

        if($sub_group_id){
            $data =  ExamSubject::where('batch_wise_semester_id',$id)->where('exam_id',$exam_id)->where('subject_id',$sub_id)->where('subject_group_id',$sub_group_id)->first();

        }else{
            $data =  ExamSubject::where('batch_wise_semester_id',$id)->where('exam_id',$exam_id)->where('subject_id',$sub_id)->first();
        }

        if( $data){
            return true;
        }else{
            return false;
        }

    }

}

if (!function_exists('check_assign_subject')) {

    function check_assign_subject($id,$sub_id,$sub_group_id="")
    {
        if($sub_group_id){
            $data =  AssignAllSubject::where('assign_subject_id',$id)->where('subject_id',$sub_id)->where('subject_group_id',$sub_group_id)->first();

        }else{
            $data =  AssignAllSubject::where('assign_subject_id',$id)->where('subject_id',$sub_id)->first();
        }

        if( $data){
            return true;
        }else{
            return false;
        }

    }

}

if (!function_exists('ageDOB')) {

    function ageDOB($dob)
    {
        $birthDate = explode("-", $dob);

        date_default_timezone_set("Asia/Dhaka"); /* can change with others time zone */

        $ageY = date("Y") - intval($birthDate[0]);
        $ageM = date("n") - intval($birthDate[1]);
        $ageD = date("j") - intval($birthDate[2]);

        if ($ageD < 0) {
            $ageD = $ageD += date("t");
            $ageM--;
        }
        if ($ageM < 0) {
            $ageM += 12;
            $ageY--;
        }


        if ($ageY < 0) {
            $ageD = $ageM = $ageY = -1;
        }

        return array('y' => $ageY, 'm' => $ageM, 'd' => $ageD);
    }

}