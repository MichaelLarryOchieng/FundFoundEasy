import java.util.Scanner;

public class Scope {
    public static void main(String[] args){
        final int JAN = 1;
        final int FEB = 2;
        final int MAR = 3;
        final int APR = 4;
        final int MAY = 5;
        final int JUN = 6;
        final int JUL = 7;
        final int AUG = 8;
        final int SEP = 9;
        final int OCT = 10;
        final int NOV = 11;
        final int DEC = 12;

        Scanner sc = new Scanner(System.in); //import java.util
        System.out.println("Enter month -->");
        int month = sc.nextInt();

        int numDays = 0;
        if (month == JAN || month == MAR || month == MAY || month == JUL ||
                month == AUG || month == OCT || month == DEC){
            numDays = 31;
        } else if (month == APR || month == JUN || month == SEP ||
        month == NOV) {
            numDays = 30;
        } else if (month == FEB) {
            System.out.println("Enter year -->");

            int year = sc.nextInt();

            if((year % 400 == 0) || (year % 4 == 0 && !(year % 100 == 0))){
                numDays=29;// leap year
            } else {
                numDays = 28; // divisible by 100 e.g 1900

        }
        } else {
            System.out.println("Invalid month" + month);
        }
        if (numDays > 0){
            System.out.println("Number of days is"+" "+ numDays);
        }

        Scanner sn = new Scanner(System.in);
        System.out.println("Enter your sport -->");
        String sport = sn.next();

        switch(sport){
            case "Soccer":
                System.out.println("I play soccer");
                break;
            case "Rugby":
                System.out.println("I play rugby");
            default:
                System.out.println("unknown sport");
        }

        Scanner sd = new Scanner(System.in);
        System.out.println("Enter a number 1___10 -->");

        int number = sc.nextInt();

        final int two = 2;// compile-time constant

        switch (number){
            case 1:
            case 3:
            case 5:
            case 7:
            case 9:

                System.out.println(number +" "+ "is odd");
                break;

            case two:
            case 4:
            case 6:
            case 8:
            case 10:

                System.out.println(number + " " +"is even");
                break;

            default:
                System.out.println(number + "is outside range 1___10");
        }







    }

}
