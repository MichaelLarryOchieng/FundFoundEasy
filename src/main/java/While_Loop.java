import java.util.Scanner;

public class While_Loop {
    public static void main(String[] args){
//        int x = 1;
//        while(x <= 3){
//            System.out.println("Loop"+" "+x);
//            x++;
//        }
//        System.out.println("The final value of x is"+ " "+x);


        int sum = 0;
        boolean keepGoing = true;
        while(keepGoing){
            Scanner sc = new Scanner(System.in);
            System.out.println("Enter a number-->");
            int n = sc.nextInt();
            if(n<0){
                keepGoing = false;
            } else {
                sum = sum + n; //sum += n
            }
        }
        System.out.println("Sum of numbers is"+" "+sum);
    }
}
